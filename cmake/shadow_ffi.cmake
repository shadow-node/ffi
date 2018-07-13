target_link_libraries(shadow_ffi libffi)
include_directories(include ${PROJECT_SOURCE_DIR}/deps/libffi/include)

link_directories(${PROJECT_SOURCE_DIR} ${CMAKE_BINARY_DIR}/lib)
