#include ./light

#define PI 3.1415926535897932384626433

uniform vec3 depthColor;
uniform vec3 surfaceColor;
uniform float uColorMultiplier;
uniform float uColorOffset;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - vPosition);

  // Base color
  float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
  mixStrength = smoothstep(0., 1., mixStrength);
  vec3 color = mix(depthColor, surfaceColor, mixStrength);

  // Light
  vec3 light = vec3(0.);
  light += pointLight(
    vec3(1.),
    10.,
    30.,
    0.9,
    vec3(0., .4, 0.),
    normal,
    viewDirection,
    vPosition
  );
  color *= light;

  gl_FragColor = vec4(color, 1.);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}