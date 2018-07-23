target_link_libraries(shadow_ffi libffi)
include_directories(
  include
  ${CMAKE_SYSROOT}/include
  ${CMAKE_SYSROOT}/usr/include
  ${CMAKE_SYSROOT}/usr/include/shadow-node
  ${CMAKE_INCLUDE_PATH}
  ${CMAKE_INCLUDE_PATH}/shadow-node
  ${PROJECT_SOURCE_DIR}/deps/libffi/include
  ${CMAKE_BINARY_DIR}/deps/libffi/include)

link_directories(${PROJECT_SOURCE_DIR} ${CMAKE_BINARY_DIR}/lib)
