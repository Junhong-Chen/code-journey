// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.);
  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  vNormal = (modelMatrix * vec4(normal, 0.)).xyz;
  vPosition = modelPosition.xyz;
}