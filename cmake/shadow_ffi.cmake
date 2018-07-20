target_link_libraries(shadow_ffi libffi)
include_directories(
  include
  ${CMAKE_INCLUDE_PATH}
  ${CMAKE_INCLUDE_PATH}/shadow-node
  ${PROJECT_SOURCE_DIR}/deps/libffi/include
  ${CMAKE_BINARY_DIR}/deps/libffi/include)

link_directories(${PROJECT_SOURCE_DIR} ${CMAKE_BINARY_DIR}/lib)
