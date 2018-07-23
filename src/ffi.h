#ifndef SHADOW_FFI_H
#define SHADOW_FFI_H

#include <stdio.h>
#include <stdlib.h>
#include <ffi.h>
#include <dlfcn.h>

#include <shadow-node/uv.h>
#include <shadow-node/iotjs.h>
#include <shadow-node/iotjs_def.h>
#include <shadow-node/iotjs_binding.h>
#include <shadow-node/iotjs_objectwrap.h>
#include "iotjs_module_buffer.h"

#define JS_GET_ARG_IF_EXIST_OR_DEFAULT(index, type, default_val) \
  ((jargc > index) && jerry_value_is_##type(jargv[index])        \
       ? iotjs_jval_as_##type(jargv[index])                      \
       : default_val)

typedef struct
{
  ffi_closure *closure;
  void **code_loc;
  uv_async_t *handle;
} sdffi_callback_info_t;

typedef struct
{
  uv_mutex_t *mutex;
  uv_cond_t *cond;
  ffi_cif *cif;
  jerry_value_t callback;
  void *retval;
  void **parameters;
} sdffi_uv_async_info_t;

/** MARK: - ffi.c */
void sdffi_copy_string_property(char *dst, jerry_value_t obj, const char *name);
void sdffi_copy_string_value(char *dst, jerry_value_t jval);
/** END MARK: ffi.c */

/** MARK: - iotjs_module_ffi.c */
jerry_value_t wrap_ptr(void *ptr);
void *unwrap_ptr_from_jbuffer(jerry_value_t jbuffer);
/** END MARK: iotjs_module_ffi.c */

/** MARK: - callback_info.c */
void LibFFICallbackInfo(jerry_value_t exports);
/** END MARK: callback_info.c*/

/** MARK: - callback_info.c */
void LibFFITypes(jerry_value_t exports);
void sdffi_uv_async_cb(uv_async_t *handle);
void sdffi_uv_async_handle_close_cb(uv_handle_t *handle);
/** END MARK: callback_info.c*/

/** MARK: - types.c */
ffi_type *sdffi_str_to_ffi_type_ptr(char *str);
void sdffi_cast_jval_to_pointer(void *ptr, ffi_type *type_ptr, jerry_value_t jval);
/** END MARK: types.c */

#endif /* SHADOW_FFI_H */
