#include ./simplex4DNoise.glsl

uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;
uniform float uWarpedPositionFrequency;
uniform float uWarpedTimeFrequency;
uniform float uWarpedStrength;

attribute vec4 tangent;

varying float vWobble;

float getWobble(vec3 position) {
  vec3 warpedPosition = position;
  warpedPosition += simplex4DNoise(vec4(
    position * uWarpedPositionFrequency,
    uTime * uWarpedTimeFrequency
  )) * uWarpedStrength;

  return simplex4DNoise(vec4(
    warpedPosition * uPositionFrequency,
    uTime * uTimeFrequency
  )) * uStrength;
}

void main() {
  // normal, tranget, biTangent 三者互相垂直
  vec3 biTangent = cross(normal, tangent.xyz);

  // Neighbours positions
  float shift = .01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  // Wobble
  float wobble = getWobble(csm_Position);
  csm_Position += wobble * normal;
  positionA += getWobble(positionA) * normal;
  positionB += getWobble(positionB) * normal;

  // Compute normal
  vec3 toA = normalize(positionA - csm_Position);
  vec3 toB = normalize(positionB - csm_Position);
  csm_Normal = cross(toA, toB);

  // Rarying
  vWobble = wobble / uStrength; // -1 ~ 1
}