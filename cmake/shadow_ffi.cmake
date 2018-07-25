if (LIBFFI_LINK_EXTERNAL)
  find_library(LIBFFI_EXTERNAL_PATH NAMES libffi libffi.dylib libffi.so)
  target_link_libraries(shadow_ffi ${LIBFFI_EXTERNAL_PATH})
else()
  target_link_libraries(shadow_ffi libffi)
endif()

set(PROJECT_LIBFFI_HEADERS_DIR
  ${PROJECT_SOURCE_DIR}/deps/libffi/include
  ${CMAKE_BINARY_DIR}/deps/libffi/include)

include_directories(
  include
  ${CMAKE_SYSROOT}/include
  ${CMAKE_SYSROOT}/usr/include
  ${CMAKE_SYSROOT}/usr/include/shadow-node
  ${CMAKE_INCLUDE_PATH}
  ${CMAKE_INCLUDE_PATH}/shadow-node)

# if libffi shipped with system is used, search ffi headers in system include directory
if (NOT LIBFFI_LINK_EXTERNAL)
  include_directories(${PROJECT_LIBFFI_HEADERS_DIR})
endif()

file(GLOB_RECURSE SHADOW_FFI_JS_FILES lib/*.js lib/**/*.js)

install(TARGETS shadow_ffi DESTINATION ${CMAKE_INSTALL_DIR}/packages/shadow-ffi/build/bindings)
install(FILES ${SHADOW_FFI_JS_FILES} DESTINATION ${CMAKE_INSTALL_DIR}/packages/shadow-ffi/lib)
