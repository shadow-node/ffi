#include "ffi.h"

JS_FUNCTION(AllocPointer) {
  void **ptrptr = malloc(sizeof(void *));
  return wrap_ptr(ptrptr);
}

JS_FUNCTION(UnwrapPointerPointer) {
  void **ptrptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  return wrap_ptr(*ptrptr);
}

JS_FUNCTION(WrapIntegerValue) {
  int val = (int)JS_GET_ARG(0, number);
  int *ptr = malloc(sizeof(int));
  *ptr = val;
  return wrap_ptr(ptr);
}

JS_FUNCTION(UnwrapIntegerValue) {
  int *ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  return jerry_create_number((double)*ptr);
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
  return jerry_create_string(*ptr);
}

JS_FUNCTION(WrapPointers) {
  size_t num_args = JS_GET_ARG(0, number);
  void** ptrptr = malloc(sizeof(void*) * num_args);

  for (size_t idx = 0; idx < num_args; idx ++) {
    jerry_value_t jval = jargv[idx + 1];
    void *ptr = unwrap_ptr_from_jbuffer(jval);
    ptrptr[idx] = ptr;
  }

  return wrap_ptr(ptrptr);
}

JS_FUNCTION(Free) {
  void **ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  free(*ptr);
  free(ptr);
  return jerry_create_undefined();
}

JS_FUNCTION(FreePointer) {
  void* ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  free(ptr);
  return jerry_create_undefined();
}

void LibFFITypes(jerry_value_t exports) {
  iotjs_jval_set_method(exports, "alloc_pointer", AllocPointer);
  iotjs_jval_set_method(exports, "unwrap_pointer_pointer", UnwrapPointerPointer);

  iotjs_jval_set_method(exports, "wrap_number_value", WrapNumberValue);
  iotjs_jval_set_method(exports, "unwrap_number_value", UnwrapNumberValue);
  iotjs_jval_set_method(exports, "wrap_integer_value", WrapIntegerValue);
  iotjs_jval_set_method(exports, "unwrap_integer_value", UnwrapIntegerValue);
  iotjs_jval_set_method(exports, "wrap_string_value", WrapStringValue);
  iotjs_jval_set_method(exports, "unwrap_string_value", UnwrapStringValue);
  iotjs_jval_set_method(exports, "wrap_pointers", WrapPointers);

  iotjs_jval_set_method(exports, "free", Free);
  iotjs_jval_set_method(exports, "free_pointer", FreePointer);
}
