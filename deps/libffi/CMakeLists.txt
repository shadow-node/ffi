cmake_minimum_required (VERSION 2.8.12)

enable_language(C)
enable_language(ASM)

set(CMAKE_ASM_FLAGS "${CFLAGS} -x assembler-with-cpp")

add_definitions(-DDEBUG -DPIC -DFFI_BUILDING -DHAVE_CONFIG_H)
include_directories(
  ${CMAKE_SOURCE_DIR} ${CMAKE_SOURCE_DIR}/include
  ${CMAKE_BINARY_DIR} ${CMAKE_BINARY_DIR}/include)

set(LIBFFI_SOURCE_FILES
  src/prep_cif.c
  src/types.c
  src/raw_api.c
  src/java_raw_api.c
  src/closures.c)

list(APPEND LIBFFI_SOURCE_FILES
  src/x86/ffi.c
  src/x86/ffi64.c)

if (CMAKE_SYSTEM_NAME MATCHES Darwin)
  list(APPEND LIBFFI_SOURCE_FILES
    src/x86/darwin.S
    src/x86/darwin64.S)
else()
  list(APPEND LIBFFI_SOURCE_FILES
    src/x86/unix64.S
    src/x86/sysv.S)
endif()

add_custom_target(ffi_headers echo ${CMAKE_SOURCE_DIR} ${CMAKE_BINARY_DIR}
  BYPRODUCTS include/ffi.h fficofig.h
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  COMMAND ${CMAKE_SOURCE_DIR}/autogen.sh
  COMMAND ${CMAKE_SOURCE_DIR}/configure --enable-static --disable-shared --disable-builddir --with-pic
  VERBATIM)

add_library(ffi ${LIBFFI_MODULE_TYPE} ${LIBFFI_SOURCE_FILES})
add_dependencies(ffi ffi_headers)

install(TARGETS ffi DESTINATION ${CMAKE_BINARY_DIR})
install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/include/ DESTINATION include)
