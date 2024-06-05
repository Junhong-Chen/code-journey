#include ./light.glsl

uniform vec3 uColor;
uniform vec3 uDirectionalLightColor;
uniform vec3 uPointLightColor;
uniform vec3 uDirectionalLightPosition;
uniform vec3 uPointLightPosition;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 color = uColor;
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  vec3 normal = normalize(vNormal);

  vec3 light = vec3(0.);
  light += ambientLight(vec3(1.), .02);
  light += directionalLight(uDirectionalLightColor, 1., 20., uDirectionalLightPosition, normal, viewDirection);
  light += pointLight(uPointLightColor, 1., 20., .2, uPointLightPosition, normal, viewDirection, vPosition);

  color *= light;
  gl_FragColor = vec4(color, 1.);

  // three.js fragment file
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}