uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uSize;
uniform float uTime;

attribute vec3 position;
attribute float aScale;
attribute vec3 color;
attribute vec3 aRandom;

varying vec3 vColor;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  float angle = atan(modelPosition.x, modelPosition.z);
  float distanceToCenter = length(modelPosition.xz);
  float offsetAngle = 1. / distanceToCenter * uTime / 16.;
  angle += offsetAngle;
  modelPosition.x = cos(angle) * distanceToCenter;
  modelPosition.z = sin(angle) * distanceToCenter;

  modelPosition.xyz += aRandom;

  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  gl_PointSize = uSize * aScale;
  gl_PointSize *= 1. / -viewModelPosition.z; // size 衰减

  vColor = color;
}