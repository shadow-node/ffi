#include "ffi.h"

uv_thread_t main_thread;

static void native_closure_pointer_free_cb(void *native_p)
{
  ffi_closure *closure = (ffi_closure *)native_p;
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;

  uv_close((uv_handle_t *)info->handle, sdffi_uv_async_handle_close_cb);
  free(info->code_loc);
  free(info);

  ffi_closure_free(closure);
}

static const jerry_object_native_info_t closure_pointer_object_type_info = {
    .free_cb = native_closure_pointer_free_cb};

jerry_value_t sdf_dispatchToJs(const jerry_value_t jval_callback,
                               jerry_value_t *jargs,
                               unsigned nargs)
{
  jerry_value_t jval_func_this = jerry_create_null();
  jerry_value_t jval_ret = jerry_call_function(jval_callback, jval_func_this, jargs, nargs);
  jerry_release_value(jval_func_this);

  if (jerry_value_has_error_flag(jval_ret))
  {
    jerry_value_t jval_err_str = jerry_value_to_string(jval_ret);
    jerry_size_t size = jerry_get_utf8_string_size(jval_err_str);
    char err_str_buf[size];
    sdffi_copy_string_value(err_str_buf, jval_err_str);
    printf("ffi: unexpected error on invoking js callback, reason: %s.\n", err_str_buf);

    jerry_release_value(jval_err_str);
  }

  return jval_ret;
}

void sdf_dispatchToJsWithFFITypes(const jerry_value_t jval_callback,
                                  ffi_type *rtype,
                                  ffi_type **arg_types,
                                  unsigned nargs,
                                  void *retval,
                                  void **parameters)
{
  jerry_value_t jargs[nargs];
  for (unsigned idx = 0; idx < nargs; idx++)
  {
    jargs[idx] = wrap_ptr(parameters[idx]);
  }

  jerry_value_t jval_ret = sdf_dispatchToJs(jval_callback, jargs, nargs);
  if (!jerry_value_has_error_flag(jval_ret))
  {
    sdffi_cast_jval_to_pointer(retval, rtype, jval_ret);
  }

  for (unsigned idx = 0; idx < nargs; idx++)
  {
    jerry_release_value(jargs[idx]);
  }
  jerry_release_value(jval_ret);
}

/*
 * This is the function that gets called when the C function pointer gets
 * executed.
 */

void ffiInvoke(ffi_cif *cif, void *retval, void **parameters, void *user_data)
{
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)user_data;
  uv_async_t *handle = info->handle;
  sdffi_uv_async_info_t *async_info = handle->data;

  uv_mutex_lock(async_info->mutex);
  async_info->retval = retval;
  async_info->parameters = parameters;

  uv_thread_t this_thread = uv_thread_self();
  if (uv_thread_equal(&this_thread, &main_thread))
  {
    sdffi_uv_async_cb(handle);
  }
  else
  {
    uv_async_send(handle);
    uv_cond_wait(async_info->cond, async_info->mutex);
  }
  uv_mutex_unlock(async_info->mutex);
}

/**
 * Callback function of threaded async callback wrapper over js callbacks
 *
 * Example:
 * ```
 * var callback = new Callback(retType, argsType, () => { Here comes callback handles })
 * aThreadedForeignFunction(callback)
 * ```
 */
void sdffi_uv_async_cb(uv_async_t *handle)
{
  sdffi_uv_async_info_t *info = handle->data;

  ffi_cif *cif = info->cif;
  jerry_value_t jval_callback = info->callback;
  void *retval = info->retval;
  void **parameters = info->parameters;

  sdf_dispatchToJsWithFFITypes(jval_callback,
                               cif->rtype,
                               cif->arg_types,
                               cif->nargs,
                               retval,
                               parameters);

  uv_cond_signal(info->cond);
}

int sdffi_async_handle_init(uv_async_t *handle, ffi_cif *cif, jerry_value_t jval_callback)
{
  int status;
  uv_loop_t *loop = iotjs_environment_loop((iotjs_environment_get()));
  status = uv_async_init(loop, handle, sdffi_uv_async_cb);
  if (status != 0)
  {
    return status;
  }
  sdffi_uv_async_info_t *async_info = malloc(sizeof(sdffi_uv_async_info_t));
  handle->data = async_info;
  async_info->mutex = malloc(sizeof(uv_mutex_t));
  async_info->cond = malloc(sizeof(uv_cond_t));
  status = uv_mutex_init(async_info->mutex);
  if (status != 0)
  {
    return status;
  }
  status = uv_cond_init(async_info->cond);
  if (status != 0)
  {
    return status;
  }
  async_info->cif = cif;
  // TODO: info->callback shall be acquired for preventing it from being gc-ed
  async_info->callback = jval_callback;

  return 0;
}

void sdffi_uv_async_handle_close_cb(uv_handle_t *handle)
{
  sdffi_uv_async_info_t *async_info = ((uv_async_t *)handle)->data;

  // TODO: info->callback shall be acquired for preventing it from being gc-ed
  // jerry_release_value(async_info->callback);

  uv_mutex_destroy(async_info->mutex);
  free(async_info->mutex);

  uv_cond_destroy(async_info->cond);
  free(async_info->cond);

  free(async_info);
}

JS_FUNCTION(WrapCallback)
{
  ffi_cif *callback_cif = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  jerry_value_t jval_callback = JS_GET_ARG(1, function);

  ffi_status status;
  ffi_closure *closure;
  void **code_loc = malloc(sizeof(void *));
  sdffi_callback_info_t *callback_info = malloc(sizeof(sdffi_callback_info_t));
  callback_info->code_loc = code_loc;

  uv_async_t *handle = malloc(sizeof(uv_async_t));
  int uv_status = sdffi_async_handle_init(handle, callback_cif, jval_callback);
  if (uv_status != 0)
  {
    uv_close((uv_handle_t *)handle, sdffi_uv_async_handle_close_cb);
    free(code_loc);
    free(callback_info);
    return jerry_create_number(uv_status);
  }
  callback_info->handle = handle;

  closure = ffi_closure_alloc(sizeof(ffi_closure), code_loc);
  status = ffi_prep_closure_loc(closure, callback_cif, ffiInvoke, callback_info, *code_loc);
  if (status != FFI_OK)
  {
    uv_close((uv_handle_t *)handle, sdffi_uv_async_handle_close_cb);
    free(code_loc);
    free(callback_info);
    ffi_closure_free(closure);
    return jerry_create_number(status);
  }

  jerry_value_t jval_ret = wrap_ptr(closure);
  jerry_set_object_native_pointer(jval_ret, closure, &closure_pointer_object_type_info);
  return jval_ret;
}

JS_FUNCTION(GetCallbackCodeLoc)
{
  ffi_closure *closure = (ffi_closure *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;
  return wrap_ptr(*(info->code_loc));
}

void LibFFICallbackInfo(jerry_value_t exports)
{
  main_thread = uv_thread_self();

  iotjs_jval_set_method(exports, "wrap_callback", WrapCallback);
  iotjs_jval_set_method(exports, "get_callback_code_loc", GetCallbackCodeLoc);
}
