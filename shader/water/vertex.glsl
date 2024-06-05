#include ./utils

// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;
uniform float uTime;
uniform float uWaterElevation;
uniform vec2 uWaterFrequency;
uniform float uSpeed;
uniform float uWavesElevation;
uniform float uWavesFrequency;
uniform float uWavesSpped;
uniform float uWavesIterations;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

float waveElevation(vec3 position) {
  float elevation = sin(position.x * uWaterFrequency.x + uTime * uSpeed) *
                    sin(position.z * uWaterFrequency.y + uTime * uSpeed) *
                    uWaterElevation;

  for(float i = 1.; i <= uWavesIterations; i++) {
    elevation -= abs(perlinClassic3D(vec3(position.xz * uWavesFrequency * i, uTime * uWavesSpped)) * uWavesElevation / i);
  }
  return elevation;
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.);

  // Neighbors 使用相邻的两点计算 waves 的 normal
  float shift = 0.04; // 原点到任意两点的距离
  vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0., 0.);
  vec3 modelPositionB = modelPosition.xyz + vec3(0., 0., -shift);

  // Elevation
  float elevation = waveElevation(modelPosition.xyz);
  modelPosition.y += elevation;
  modelPositionA.y += waveElevation(modelPositionA);
  modelPositionB.y += waveElevation(modelPositionB);
  
  // waveNormal
  vec3 toA = normalize(modelPositionA - modelPosition.xyz);
  vec3 toB = normalize(modelPositionB - modelPosition.xyz);
  vec3 waveNormal = cross(toA, toB);

  // Position
  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  // Varying
  vElevation = elevation;
  vNormal = waveNormal;
  vPosition = modelPosition.xyz;
}