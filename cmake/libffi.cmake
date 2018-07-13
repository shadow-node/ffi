ExternalProject_Add(ffi
  PREFIX deps/libffi
  SOURCE_DIR ${CMAKE_SOURCE_DIR}/deps/libffi
  BUILD_IN_SOURCE 0
  BINARY_DIR deps/libffi
  INSTALL_COMMAND
    ${CMAKE_COMMAND} -E copy
    ${CMAKE_BINARY_DIR}/deps/libffi/libffi.a
    ${CMAKE_BINARY_DIR}/lib/
  CMAKE_ARGS
    -DCMAKE_TOOLCHAIN_ROOT=${CMAKE_TOOLCHAIN_ROOT}
    -DCMAKE_TOOLCHAIN_FILE=${CMAKE_TOOLCHAIN_FILE}
    -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
    -DCMAKE_C_FLAGS=${CMAKE_C_FLAGS}
    -DOS=${TARGET_OS}
)

add_library(libffi STATIC IMPORTED)
add_dependencies(libffi ffi)
set_property(TARGET libffi PROPERTY
  IMPORTED_LOCATION ${CMAKE_BINARY_DIR}/lib/libffi.a)
