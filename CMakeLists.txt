cmake_minimum_required(VERSION 2.8.12)
project(shadow_ffi C)

set(LIBFFI_SOURCE_FILES
  src/ffi.c
  src/iotjs_module_ffi.c
  src/callback_info.c)

add_library(shadow_ffi MODULE ${LIBFFI_SOURCE_FILES})
set(CMAKE_C_FLAGS "-Os")

set_target_properties(shadow_ffi PROPERTIES
  PREFIX ""
  SUFFIX ".node"
  OUTPUT_NAME "shadow_ffi"
  LIBRARY_OUTPUT_DIRECTORY "${PROJECT_SOURCE_DIR}/build/"
)

if(CMAKE_SYSTEM_NAME MATCHES Darwin)
  set_target_properties(shadow_ffi PROPERTIES
    LINK_FLAGS "-undefined dynamic_lookup")
else()
  set_target_properties(shadow_ffi PROPERTIES
    LINK_FLAGS "-rdynamic")
endif()

include(ExternalProject)
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
include(cmake/libffi.cmake)
include(cmake/shadow_ffi.cmake)

set(CMAKE_BUILD_TYPE Debug)
