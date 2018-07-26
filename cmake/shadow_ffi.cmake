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

if (CMAKE_INSTALL_DIR)
  install(TARGETS shadow_ffi DESTINATION ${CMAKE_INSTALL_DIR}/build/bindings)
  install(DIRECTORY lib src DESTINATION ${CMAKE_INSTALL_DIR})
  install(FILES package.json DESTINATION ${CMAKE_INSTALL_DIR})

  if (CMAKE_BUILD_TYPE MATCHES Debug)
    install(DIRECTORY test tools DESTINATION ${CMAKE_INSTALL_DIR})
  endif()
endif()
