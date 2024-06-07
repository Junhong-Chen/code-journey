export default /* glsl */`
float angle = cos(position.y + uTime) * 0.16;
mat2 rotateMatrix = get2dRotationMatrix(angle);
#include <uv_vertex>
`