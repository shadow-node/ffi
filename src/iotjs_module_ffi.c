#include "ffi.h"

void cif_pointer_free_cb (void *cif) {
  ffi_cif *cif_ptr = (ffi_cif *) cif;
  free(cif_ptr->arg_types);
  free(cif_ptr);
}

static const jerry_object_native_info_t cif_pointer_object_type_info = {
    .free_cb = cif_pointer_free_cb};

jerry_value_t wrap_ptr(void *ptr)
{
  size_t ptr_sizeof_char = sizeof(void *) / sizeof(char);
  jerry_value_t jbuffer = iotjs_bufferwrap_create_buffer(ptr_sizeof_char);
  iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jbuffer);
  iotjs_bufferwrap_copy(bufferwrap, (char *)&ptr, ptr_sizeof_char);

  return jbuffer;
}

void *unwrap_ptr_from_jbuffer(jerry_value_t jbuffer)
{
  iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jbuffer);
  return *(void **)iotjs_bufferwrap_buffer(bufferwrap);
}

ffi_type *sdffi_jval_to_ffi_type_ptr(jerry_value_t jval)
{
  assert(jerry_value_is_string(jval));

  jerry_size_t size = jerry_get_utf8_string_size(jval);
  char *str = malloc(sizeof(char) * (size + 1));
  sdffi_copy_string_value(str, jval);

  ffi_type *type = sdffi_str_to_ffi_type_ptr(str);
  free(str);
  return type;
}

ffi_type **sdffi_jarr_to_ffi_type_arr_ptr(jerry_value_t jarr, uint32_t length)
{
  assert(jerry_value_is_array(jarr));

  ffi_type **type_arr = malloc(sizeof(void *) * length);

  for (uint32_t idx = 0; idx < length; idx++)
  {
    jerry_value_t item = iotjs_jval_get_property_by_index(jarr, idx);
    type_arr[idx] = sdffi_jval_to_ffi_type_ptr(item);
    jerry_release_value(item);
  }

  return type_arr;
}

/*
 * Function that creates and returns an `ffi_cif` pointer from the given return
 * value type and argument types.
 *
 * args[0] - the CIF buffer
 * args[1] - the number of args
 * args[2] - the "return type" pointer
 * args[3] - the "arguments types array" pointer
 * args[4] - the ABI to use
 *
 * returns the ffi_status result from ffi_prep_cif()
 */
JS_FUNCTION(FFIPrepCif)
{
  jerry_value_t jval_buffer = JS_GET_ARG(0, object);
  int num_args = JS_GET_ARG(1, number);
  jerry_value_t jval_rtype = jargv[2];
  jerry_value_t jval_arg_types = JS_GET_ARG(3, object);
  jerry_value_t jval_abi = JS_GET_ARG_IF_EXIST(4, number);

  ffi_status status;

  ffi_type **arg_types = sdffi_jarr_to_ffi_type_arr_ptr(jval_arg_types, num_args);
  ffi_type *rtype = sdffi_jval_to_ffi_type_ptr(jval_rtype);
  ffi_cif *cif_ptr = malloc(sizeof(ffi_cif));

  ffi_abi abi = FFI_DEFAULT_ABI;
  if (jerry_value_is_number(jval_abi))
  {
    abi = jerry_get_number_value(jval_abi);
  }

  status = ffi_prep_cif(cif_ptr, abi, num_args, rtype, arg_types);
  if (status == FFI_OK)
  {
    iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jval_buffer);
    size_t data_len = sizeof(void *) / sizeof(char);
    assert(iotjs_bufferwrap_length(bufferwrap) >= data_len);

    size_t written = iotjs_bufferwrap_copy(bufferwrap, (char *)&cif_ptr, data_len);
    assert(written == data_len);

    jerry_set_object_native_pointer(jval_buffer, cif_ptr, &cif_pointer_object_type_info);
  }

  return jerry_create_number(status);
}

/*
 * JS wrapper around `ffi_call()`.
 *
 * args[0] - Buffer - the `ffi_cif *`
 * args[1] - Buffer - the C function pointer to invoke
 * args[2] - Buffer - the `void *` buffer big enough to hold the return value
 * args[3] - Buffer - the `void **` array of pointers containing the arguments
 */
JS_FUNCTION(FFICall)
{
  ffi_cif *cif_ptr = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  void *fn = unwrap_ptr_from_jbuffer(JS_GET_ARG(1, object));
  void *ret = unwrap_ptr_from_jbuffer(JS_GET_ARG(2, object));
  void **fnargs = unwrap_ptr_from_jbuffer(JS_GET_ARG(3, object));

  ffi_call(
      cif_ptr,
      FFI_FN(fn),
      (void *)ret,
      (void **)fnargs);

  return jerry_create_undefined();
}

/**
 * Callback function of threaded async calls from JS
 *
 * Example:
 * ```js
 * aSynchronousForeignFunction.async(...args, (error, retVal) => { Here comes callback hanles })
 * ```
 */
void sdffi_uv_work_cb (uv_work_t *req) {
  sdffi_uv_work_info_t *info = req->data;
  ffi_cif *cif_ptr = info->cif;
  void *fn = info->fn;
  void *ret = info->ret;
  void **fnargs = info->fnargs;

  ffi_call(cif_ptr, FFI_FN(fn), ret, fnargs);
}

/*
 * JS wrapper around `ffi_call()`.
 *
 * args[0] - Buffer - the `ffi_cif *`
 * args[1] - Buffer - the C function pointer to invoke
 * args[2] - Buffer - the `void *` buffer big enough to hold the return value
 * args[3] - Buffer - the `void **` array of pointers containing the arguments
 * args[4] - Function - the js callback
 */
JS_FUNCTION(FFICallAsync) {
  ffi_cif *cif_ptr = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  void *fn = unwrap_ptr_from_jbuffer(JS_GET_ARG(1, object));
  void *ret = unwrap_ptr_from_jbuffer(JS_GET_ARG(2, object));
  void **fnargs = unwrap_ptr_from_jbuffer(JS_GET_ARG(3, object));
  jerry_value_t jval_cb = JS_GET_ARG(4, function);

  int status;
  uv_work_t* work_req = malloc(sizeof(uv_work_t));
  sdffi_uv_work_info_t *info = malloc(sizeof(sdffi_uv_work_info_t));

  info->cif = cif_ptr;
  info->fn = fn;
  info->ret = ret;
  info->fnargs = fnargs;
  info->callback = jerry_acquire_value(jval_cb);

  work_req->data = info;
  status = uv_queue_work(uv_default_loop(), work_req, sdffi_uv_work_cb, sdffi_uv_work_after_cb);
  if (status != 0) {
    return jerry_create_number(status);
  }

  return jerry_create_number(0);
}

void LibFFI(jerry_value_t exports)
{
  iotjs_jval_set_method(exports, "ffi_prep_cif", FFIPrepCif);
  iotjs_jval_set_method(exports, "ffi_call", FFICall);
  iotjs_jval_set_method(exports, "ffi_call_async", FFICallAsync);

#define WRAP(name)                                             \
  do                                                           \
  {                                                            \
    jerry_value_t wrap_##name = wrap_ptr(name);                \
    iotjs_jval_set_property_jval(exports, #name, wrap_##name); \
    jerry_release_value(wrap_##name);                          \
  } while (0)

  WRAP(dlopen);
  WRAP(dlsym);
  WRAP(dlclose);
  WRAP(dlerror);
  WRAP(printf);

#undef WRAP

#define WRAP_PREPROCESSOR_VAL(flag)                    \
  do                                                   \
  {                                                    \
    jerry_value_t val = jerry_create_number(flag);     \
    iotjs_jval_set_property_jval(exports, #flag, val); \
    jerry_release_value(val);                          \
  } while (0)

  WRAP_PREPROCESSOR_VAL(RTLD_LAZY);
  WRAP_PREPROCESSOR_VAL(RTLD_NOW);

#undef WRAP_PREPROCESSOR_VAL

  LibFFICallbackInfo(exports);
  LibFFITypes(exports);
}

NODE_MODULE("libffi", LibFFI)
