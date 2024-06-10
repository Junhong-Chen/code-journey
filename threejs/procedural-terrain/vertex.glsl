#include ./simplexNoise2d

uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;
uniform float uTime;

varying vec3 vPosition;
varying float vUpDot;

float getElevation(vec2 position) {
  float elevation = 0.;
  vec2 warpedPosition = position;
  warpedPosition.y += uTime * .2;
  warpedPosition += simplexNoise2d(warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength;

  // 叠加不同幅度的噪声
  for (float i = 0.; i < 3.; i++) {
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * pow(2., i)) / pow(2., i + 1.);
  }

  float elevationSign = sign(elevation);
  elevation = pow(abs(elevation), 2.) * elevationSign;
  elevation *= uStrength;
  return elevation;
}

void main() {
  float elevation = getElevation(csm_Position.xz);
  csm_Position.y += elevation;

  // 分别取 x、z 方向邻近的两个点，两个点都在 y 方向叠加同一个噪声函数，然后用这两个点生成 x、z 方向的单位向量，叉乘后得到叠加噪声函数后的法线
  float shift = .01;
  vec3 positionA = csm_Position + vec3(shift, 0., 0.);
  vec3 positionB = csm_Position + vec3(0., 0., -shift);
  positionA.y = getElevation(positionA.xz);
  positionB.y = getElevation(positionB.xz);
  vec3 toA = normalize(positionA - csm_Position);
  vec3 toB = normalize(positionB - csm_Position);
  csm_Normal = cross(toA, toB);

  vPosition = csm_Position;
  vPosition.z += uTime * .2; // 同步在 getElevation 函数中偏移的轴
  vUpDot = dot(csm_Normal, vec3(0., 1., 0.));
}