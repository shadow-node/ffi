#ifndef SHADOW_FFI_H
#define SHADOW_FFI_H

#include <stdio.h>
#include <stdlib.h>
#include <ffi.h>
#include <dlfcn.h>

#include <iotjs.h>
#include <iotjs_def.h>
#include <iotjs_binding.h>
#include <iotjs_objectwrap.h>

typedef struct {
  iotjs_jobjectwrap_t jobjectwrap;
  ffi_cif cif;
} IOTJS_VALIDATED_STRUCT(iotjs_cifwrap_t);

void sdffi_copy_string_property(char *dst, jerry_value_t obj, const char *name);
void sdffi_copy_string_value(char *dst, jerry_value_t jval);

#endif /* SHADOW_FFI_H */
