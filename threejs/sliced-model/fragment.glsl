uniform float uSliceStart;
uniform float uSliceArc;

varying vec3 vPosition;

void main() {
  
  float radian = atan(vPosition.y, vPosition.x);
  radian -= uSliceStart; // 相当于旋转了 uSliceStart 这么多的弧度值
  radian = mod(radian, PI2); // -PI ~ PI => 0 ~ PI2。需要注意，glsl 中取模运算得到的结果不同于 js。比如 -0.25 % 1 得到 0.75，但在 js 中会得到 -0.25

  if (radian >= 0. && radian <= uSliceArc)
    discard;

  float csm_Slice;
}