#include "ffi.h"

static void native_closure_pointer_free_cb(void* native_p) {
  ffi_closure *closure = (ffi_closure *)native_p;
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;

  // TODO: info->callback shall be acquired for preventing it from being gc-ed
  // jerry_release_value(info->callback);
  free(info->code_loc);
  free(info);

  ffi_closure_free(closure);
}

static const jerry_object_native_info_t closure_pointer_object_type_info = {
  .free_cb = native_closure_pointer_free_cb
};

jerry_value_t sdf_dispatchToJs(const jerry_value_t jval_callback,
                               jerry_value_t *jargs,
                               unsigned nargs) {
  jerry_value_t jval_func_this = jerry_create_null();
  jerry_value_t jval_ret = jerry_call_function(jval_callback, jval_func_this, jargs, nargs);
  jerry_release_value(jval_func_this);

  if (jerry_value_has_error_flag(jval_ret)) {
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
                                  void **parameters) {
  jerry_value_t jargs[nargs];
  for (unsigned idx = 0; idx < nargs; idx ++) {
    jargs[idx] = wrap_ptr(parameters[idx]);
  }

  jerry_value_t jval_ret = sdf_dispatchToJs(jval_callback, jargs, nargs);
  if (!jerry_value_has_error_flag(jval_ret)) {
  sdffi_cast_jval_to_pointer(retval, rtype, jval_ret);
  }

  for (unsigned idx = 0; idx < nargs; idx ++) {
    jerry_release_value(jargs[idx]);
  }
  jerry_release_value(jval_ret);
}

/*
 * This is the function that gets called when the C function pointer gets
 * executed.
 */

void ffiInvoke(ffi_cif *cif, void *retval, void **parameters, void *user_data) {
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)user_data;
  jerry_value_t jval_callback = info->callback;

  sdf_dispatchToJsWithFFITypes(jval_callback,
                   cif->rtype,
                   cif->arg_types,
                   cif->nargs,
                   retval,
                   parameters);
}

JS_FUNCTION(WrapCallback) {
  ffi_cif *callback_cif = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  jerry_value_t jval_callback = JS_GET_ARG(1, function);

  ffi_status status;
  ffi_closure *closure;
  void **code_loc = malloc(sizeof(void *));
  sdffi_callback_info_t *callback_info = malloc(sizeof(sdffi_callback_info_t));
  callback_info->cif = callback_cif;
  callback_info->code_loc = code_loc;
  // TODO: callback_info->callback shall be acquired for preventing it from being gc-ed
  callback_info->callback = jval_callback;

  closure = ffi_closure_alloc(sizeof(ffi_closure), code_loc);
  status = ffi_prep_closure_loc(closure, callback_cif, ffiInvoke, callback_info, *code_loc);
  if (status != FFI_OK) {
    jerry_release_value(callback_info->callback);
    free(callback_info->code_loc);
    free(callback_info);
    ffi_closure_free(closure);
    return jerry_create_number(status);
  }

  jerry_value_t jval_ret = wrap_ptr(closure);
  jerry_set_object_native_pointer(jval_ret, closure, &closure_pointer_object_type_info);
  return jval_ret;
}

JS_FUNCTION(GetCallbackCodeLoc) {
  ffi_closure *closure = (ffi_closure *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;
  return wrap_ptr(*(info->code_loc));
}

void LibFFICallbackInfo(jerry_value_t exports) {
  iotjs_jval_set_method(exports, "wrap_callback", WrapCallback);
  iotjs_jval_set_method(exports, "get_callback_code_loc", GetCallbackCodeLoc);
}
