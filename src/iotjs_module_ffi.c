#include "iotjs_module_ffi.h"

jerry_value_t wrap_ptr (void *ptr) {
  size_t ptr_sizeof_char = sizeof(void*) / sizeof(char);
  jerry_value_t jbuffer = iotjs_bufferwrap_create_buffer(ptr_sizeof_char);
  iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jbuffer);
  iotjs_bufferwrap_copy(bufferwrap, (char *) &ptr, ptr_sizeof_char);

  return jbuffer;
}

void *unwrap_ptr_from_jbuffer(jerry_value_t jbuffer) {
  iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jbuffer);
  return *(void**)iotjs_bufferwrap_buffer(bufferwrap);
}

ffi_type* sdffi_str_to_ffi_type_ptr(char *str) {
  ffi_type* type_ptr;

  if(strcmp(str, "string") == 0) {
    type_ptr = &ffi_type_pointer;
  } else if (strcmp(str, "int") == 0) {
    type_ptr = &ffi_type_uint;
  } else if (strcmp(str, "double") == 0) {
    type_ptr = &ffi_type_double;
  } else {
    // defaults to ffi_type_void
    type_ptr = &ffi_type_void;
  }

  return type_ptr;
}

ffi_type* sdffi_jval_to_ffi_type_ptr(jerry_value_t jval) {
  assert(jerry_value_is_string(jval));

  jerry_size_t size = jerry_get_string_size(jval);
  char *str = malloc(sizeof(char) * (size + 1));
  sdffi_copy_string_value(str, jval);

  return sdffi_str_to_ffi_type_ptr(str);
}

ffi_type** sdffi_jarr_to_ffi_type_arr_ptr(jerry_value_t jarr, uint32_t length) {
  assert(jerry_value_is_array(jarr));

  ffi_type **type_arr = malloc(sizeof(void*) * length);

  for (uint32_t idx = 0; idx < length; idx++) {
    jerry_value_t item = iotjs_jval_get_property_by_index(jarr, idx);
    type_arr[idx] = sdffi_jval_to_ffi_type_ptr(item);
    jerry_release_value(item);
  }

  return type_arr;
}

JS_FUNCTION(WrapNumberValue) {
  double val = JS_GET_ARG(0, number);
  double *ptr = malloc(sizeof(double));
  *ptr = val;
  return wrap_ptr(ptr);
}

JS_FUNCTION(UnwrapNumberValue) {
  double *ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  return jerry_create_number(*ptr);
}

JS_FUNCTION(WrapStringValue) {
  jerry_value_t jval = jargv[0];
  size_t str_len = jerry_get_string_size(jval) + 1;
  char* str_data = malloc(sizeof(char) * str_len);
  sdffi_copy_string_value(str_data, jval);

  char **ptr = malloc(sizeof(char *));
  *ptr = str_data;

  return wrap_ptr(ptr);
}

JS_FUNCTION(UnwrapStringValue) {
  jerry_char_t **ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  jerry_char_t *data = *ptr;

  return jerry_create_string(data);
}

JS_FUNCTION(WrapPointer) {
  void* ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  void** ptrptr = malloc(sizeof(void*));
  *ptrptr = ptr;
  return wrap_ptr(ptrptr);
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
JS_FUNCTION(FFIPrepCif) {
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
  if (jerry_value_is_number(jval_abi)) {
    abi = jerry_get_number_value(jval_abi);
  }

  status = ffi_prep_cif(cif_ptr, abi, num_args, rtype, arg_types);
  if (status == FFI_OK) {
    iotjs_bufferwrap_t *bufferwrap = iotjs_bufferwrap_from_jbuffer(jval_buffer);
    size_t data_len = sizeof(void*) / sizeof(char);
    assert(iotjs_bufferwrap_length(bufferwrap) >= data_len);

    size_t written = iotjs_bufferwrap_copy(bufferwrap, (char*) &cif_ptr, data_len);
    assert(written == data_len);
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
JS_FUNCTION(FFICall) {
  ffi_cif *cif_ptr = (ffi_cif *)unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  void *fn = unwrap_ptr_from_jbuffer(JS_GET_ARG(1, object));
  void *ret = unwrap_ptr_from_jbuffer(JS_GET_ARG(2, object));
  void **fnargs = unwrap_ptr_from_jbuffer(JS_GET_ARG(3, object));

  ffi_call(
    cif_ptr,
    FFI_FN(fn),
    (void *)ret,
    (void **)fnargs
  );

  return jerry_create_undefined();
}

JS_FUNCTION(IsPtrNull) {
  void *ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  return jerry_create_boolean(ptr == NULL);
}

void LibFFI(jerry_value_t exports)
{
  iotjs_jval_set_method(exports, "ffi_prep_cif", FFIPrepCif);
  iotjs_jval_set_method(exports, "ffi_call", FFICall);

  iotjs_jval_set_method(exports, "is_ptr_null", IsPtrNull);

  iotjs_jval_set_method(exports, "wrap_number_value", WrapNumberValue);
  iotjs_jval_set_method(exports, "unwrap_number_value", UnwrapNumberValue);
  iotjs_jval_set_method(exports, "wrap_string_value", WrapStringValue);
  iotjs_jval_set_method(exports, "unwrap_string_value", UnwrapStringValue);
  iotjs_jval_set_method(exports, "wrap_pointer", WrapPointer);

  iotjs_jval_set_property_jval(exports, "dlopen", wrap_ptr(dlopen));
  iotjs_jval_set_property_jval(exports, "dlsym", wrap_ptr(dlsym));
  iotjs_jval_set_property_jval(exports, "printf", wrap_ptr(printf));
}

NODE_MODULE("libffi", LibFFI)
