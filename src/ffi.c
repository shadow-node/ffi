#include "ffi.h"

void sdffi_copy_string_property(char *dst, jerry_value_t obj, const char *name)
{
  jerry_value_t name_ = jerry_create_string((const jerry_char_t *)name);
  jerry_value_t has_key_ = jerry_has_property(obj, name_);
  bool has_key = jerry_get_boolean_value(has_key_);
  if (has_key)
  {
    jerry_value_t property = iotjs_jval_get_property(obj, name);
    jerry_size_t property_size = jerry_get_string_size(property);
    jerry_string_to_char_buffer(property, (jerry_char_t *)dst, property_size);
    dst[property_size] = '\0';
    jerry_release_value(property);
  }
  jerry_release_value(has_key_);
  jerry_release_value(name_);
}

void sdffi_copy_string_value(char *dst, jerry_value_t jval)
{
  jerry_size_t str_size = jerry_get_string_size(jval);
  jerry_string_to_char_buffer(jval, (jerry_char_t *)dst, str_size);
  dst[str_size] = '\0';
}
