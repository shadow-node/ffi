#include "ffi.h"
#include "iotjs_module_buffer.h"

void sdf_dispatchToJs(sdffi_callback_info_t *info, void *retval, void **parameters) {
  jerry_value_t jval_callback = info->callback;
  jerry_value_t jargs[] = {};
  jerry_value_t jval_ret = jerry_call_function(jval_callback, jerry_create_null(), jargs, 0);

  jerry_release_value(jval_ret);
}

/*
 * This is the function that gets called when the C function pointer gets
 * executed.
 */

void ffiInvoke(ffi_cif *cif, void *retval, void **parameters, void *user_data) {
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)user_data;
  sdf_dispatchToJs(info, retval, parameters);
}

JS_FUNCTION(WrapCallback) {
  ffi_cif *callback_cif = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  jerry_value_t jval_callback = JS_GET_ARG(1, function);

  ffi_status status;
  ffi_closure *closure;
  void **code = malloc(sizeof(void *));
  sdffi_callback_info_t *user_data = malloc(sizeof(sdffi_callback_info_t));
  user_data->code_loc = code;
  user_data->callback = jerry_acquire_value(jval_callback);

  closure = ffi_closure_alloc(sizeof(ffi_closure), code);
  status = ffi_prep_closure_loc(closure, callback_cif, ffiInvoke, user_data, *code);
  if (status != FFI_OK) {
    ffi_closure_free(closure);
    free(callback_cif);
    return jerry_create_number(status);
  }

  jerry_release_value(jval_callback);
  return wrap_ptr(closure);
}

JS_FUNCTION(GetCallbackCodeLoc) {
  ffi_closure *closure = (ffi_closure *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;
  return wrap_ptr(info->code_loc);
}

JS_FUNCTION(ReleaseCallback) {
  ffi_closure *closure = (ffi_closure *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  sdffi_callback_info_t *info = (sdffi_callback_info_t *)closure->user_data;

  free(info->code_loc);
  jerry_release_value(info->callback);

  ffi_closure_free(closure);

  return jerry_create_undefined();
}

void LibFFICallbackInfo(jerry_value_t exports) {
  iotjs_jval_set_method(exports, "wrap_callback", WrapCallback);
  iotjs_jval_set_method(exports, "get_callback_code_loc", GetCallbackCodeLoc);
  iotjs_jval_set_method(exports, "release_callback", ReleaseCallback);
}
