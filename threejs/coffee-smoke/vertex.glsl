#include ./rotate2D

// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;
uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

void main() {
  vec3 _position = position;
  // Twist
  float twistPerlin = texture(uPerlinTexture, vec2(.5, uv.y * .2 - uTime * .005)).r;
  float angle = twistPerlin * 10.;
  _position.xz = rotate2D(position.xz, angle);

  // Wind
  vec2 windOffset = vec2(
    texture(uPerlinTexture, vec2(.25, uTime * .02)).r - .5,
    texture(uPerlinTexture, vec2(.75, uTime * .02)).r - .5
  );
  windOffset *= pow(uv.y, 2.) * 4.;
  _position.xz += windOffset;

  vec4 modelPosition = modelMatrix * vec4(_position, 1.0);
  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  vUv = uv;
}