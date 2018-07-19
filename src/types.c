#include "ffi.h"

static const jerry_object_native_info_t pointer_object_type_info = {
  .free_cb = free
};

static void native_string_pointer_free_cb(void* native_p) {
  char **char_ptrptr = (char **) native_p;
  free(*char_ptrptr);
  free(char_ptrptr);
}

static const jerry_object_native_info_t string_pointer_object_type_info = {
  .free_cb = native_string_pointer_free_cb
};

JS_FUNCTION(Alloc) {
  size_t size = (size_t)JS_GET_ARG(0, number);

  void *ptr = malloc(size);
  memset(ptr, 0, size);

  jerry_value_t jval_ptr = wrap_ptr(ptr);
  jerry_set_object_native_pointer(jval_ptr, ptr, &pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(AllocPointer) {
  void **ptrptr = malloc(sizeof(void *));
  *ptrptr = NULL;

  jerry_value_t jval_ptr = wrap_ptr(ptrptr);
  jerry_set_object_native_pointer(jval_ptr, ptrptr, &pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(UnwrapPointerPointer) {
  void **ptrptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  int idx = (int) JS_GET_ARG_IF_EXIST_OR_DEFAULT(1, number, 0);

  void *ptr = ptrptr[idx];
  return wrap_ptr(ptr);
}

JS_FUNCTION(WrapIntValue) {
  int val = (int)JS_GET_ARG(0, number);
  int *ptr = malloc(sizeof(int));
  *ptr = val;

  jerry_value_t jval_ptr = wrap_ptr(ptr);
  jerry_set_object_native_pointer(jval_ptr, ptr, &pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(UnwrapIntValue) {
  int *ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  int idx = (int) JS_GET_ARG_IF_EXIST_OR_DEFAULT(1, number, 0);

  int val = ptr[idx];
  return jerry_create_number((double)val);
}

JS_FUNCTION(WrapNumberValue) {
  double val = JS_GET_ARG(0, number);
  double *ptr = malloc(sizeof(double));
  *ptr = val;

  jerry_value_t jval_ptr = wrap_ptr(ptr);
  jerry_set_object_native_pointer(jval_ptr, ptr, &pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(UnwrapNumberValue) {
  double *ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  int idx = (int) JS_GET_ARG_IF_EXIST_OR_DEFAULT(1, number, 0);

  double val = ptr[idx];
  return jerry_create_number(val);
}

JS_FUNCTION(WrapStringValue) {
  jerry_value_t jval = jargv[0];
  size_t str_len = jerry_get_utf8_string_size(jval) + 1;
  char* str_data = malloc(sizeof(char) * str_len);
  sdffi_copy_string_value(str_data, jval);

  char **ptr = malloc(sizeof(char *));
  *ptr = str_data;


  jerry_value_t jval_ptr = wrap_ptr(ptr);
  jerry_set_object_native_pointer(jval_ptr, ptr, &string_pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(UnwrapStringValue) {
  jerry_char_t **ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  int idx = (int) JS_GET_ARG_IF_EXIST_OR_DEFAULT(1, number, 0);

  jerry_char_t *str_ptr = ptr[idx];
  return jerry_create_string(str_ptr);
}

JS_FUNCTION(WrapPointers) {
  size_t num_args = JS_GET_ARG(0, number);
  void** ptrptr = malloc(sizeof(void*) * num_args);

  for (size_t idx = 0; idx < num_args; idx ++) {
    jerry_value_t jval = jargv[idx + 1];
    void *ptr = unwrap_ptr_from_jbuffer(jval);
    ptrptr[idx] = ptr;
  }

  jerry_value_t jval_ptr = wrap_ptr(ptrptr);
  jerry_set_object_native_pointer(jval_ptr, ptrptr, &pointer_object_type_info);
  return jval_ptr;
}

JS_FUNCTION(IsPointerNull) {
  void* ptr = unwrap_ptr_from_jbuffer(JS_GET_ARG(0, object));
  return jerry_create_boolean(ptr == NULL);
}

ffi_type* sdffi_str_to_ffi_type_ptr(char *str) {
  ffi_type* type_ptr;

  if(strcmp(str, "string") == 0) {
    type_ptr = &ffi_type_pointer;
  } else if (strcmp(str, "void *") == 0) {
    type_ptr = &ffi_type_pointer;
  } else if (strcmp(str, "pointer") == 0) {
    type_ptr = &ffi_type_pointer;
  } else if (strcmp(str, "int") == 0) {
    type_ptr = &ffi_type_sint;
  } else if (strcmp(str, "double") == 0) {
    type_ptr = &ffi_type_double;
  } else {
    // defaults to ffi_type_void
    type_ptr = &ffi_type_void;
  }

  return type_ptr;
}

void sdffi_cast_jval_to_pointer(void *ptr, ffi_type *type_ptr, jerry_value_t jval) {
  if (jerry_value_is_string(jval)) {
    jerry_length_t len = jerry_get_string_length(jval);
    char *val = malloc(sizeof(char) * len);
    jerry_string_to_char_buffer(jval, (jerry_char_t *)val, len);

    *(char **)ptr = val;
  } else if (jerry_value_is_number(jval)) {
    if (type_ptr == &ffi_type_double) {
      *(double *)ptr = jerry_get_number_value(jval);
    } else if (type_ptr == &ffi_type_slong) {
      *(long *)ptr = (long) jerry_get_number_value(jval);
    } else if (type_ptr == &ffi_type_sint) {
      *(int *)ptr = (int) jerry_get_number_value(jval);
    }
  } else if (type_ptr == &ffi_type_pointer) {
    void *unwrap_ptr = unwrap_ptr_from_jbuffer(jval);
    *(char **)ptr = unwrap_ptr;
  }
}

void LibFFITypes(jerry_value_t exports) {
  iotjs_jval_set_method(exports, "alloc", Alloc);
  iotjs_jval_set_method(exports, "alloc_pointer", AllocPointer);
  iotjs_jval_set_method(exports, "unwrap_pointer_pointer", UnwrapPointerPointer);

  iotjs_jval_set_method(exports, "wrap_number_value", WrapNumberValue);
  iotjs_jval_set_method(exports, "unwrap_number_value", UnwrapNumberValue);
  iotjs_jval_set_method(exports, "wrap_int_value", WrapIntValue);
  iotjs_jval_set_method(exports, "unwrap_int_value", UnwrapIntValue);
  iotjs_jval_set_method(exports, "wrap_string_value", WrapStringValue);
  iotjs_jval_set_method(exports, "unwrap_string_value", UnwrapStringValue);
  iotjs_jval_set_method(exports, "wrap_pointers", WrapPointers);

  iotjs_jval_set_method(exports, "is_pointer_null", IsPointerNull);

  jerry_value_t jval_constant = jerry_create_object();
  #define CONSTANT(name, type, value) \
    do { \
      iotjs_jval_set_property_##type(jval_constant, #name, value); \
    } while (0)

  CONSTANT(POINTER_SIZE, number, sizeof(void *));
  CONSTANT(INT_SIZE, number, sizeof(int));
  CONSTANT(LONG_SIZE, number, sizeof(long));
  CONSTANT(SIZE_T_SIZE, number, sizeof(size_t));

  #undef CONSTANT
  iotjs_jval_set_property_jval(exports, "Constant", jval_constant);
  jerry_release_value(jval_constant);
}
