if (LIBFFI_LINK_EXTERNAL)
  find_library(LIBFFI_EXTERNAL_PATH NAMES libffi libffi.dylib libffi.so)
  target_link_libraries(shadow_ffi ${LIBFFI_EXTERNAL_PATH})
else()
  target_link_libraries(shadow_ffi libffi)
endif()

include_directories(
  include
  ${CMAKE_SYSROOT}/include
  ${CMAKE_SYSROOT}/usr/include
  ${CMAKE_SYSROOT}/usr/include/shadow-node
  ${CMAKE_INCLUDE_PATH}
  ${CMAKE_INCLUDE_PATH}/shadow-node
  ${PROJECT_SOURCE_DIR}/deps/libffi/include
  ${CMAKE_BINARY_DIR}/deps/libffi/include)
