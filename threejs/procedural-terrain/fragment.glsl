#include ./simplexNoise2d

uniform vec3 uColorWaterDeep;
uniform vec3 uColorWaterSurface;
uniform vec3 uColorSand;
uniform vec3 uColorGrass;
uniform vec3 uColorRock;
uniform vec3 uColorSnow;

varying vec3 vPosition;
varying float vUpDot;

void main() {
  vec3 color = vec3(1.);

  // Water
  float waterSurfaceMix = smoothstep(-1., -.1, vPosition.y);
  color = mix(uColorWaterDeep, uColorWaterSurface, waterSurfaceMix);

  // Sand
  float sandMix = step(-.1, vPosition.y);
  color = mix(color, uColorSand, sandMix);

  // Grass
  float grassMix = step(-.05, vPosition.y);
  color = mix(color, uColorGrass, grassMix);

  // Rock
  float rockMix = step(vUpDot, .8); // 假设垂直的面是岩石层
  rockMix *= grassMix; // 限定在草地层
  color = mix(color, uColorRock, rockMix);

  // Snow
  float snowThreshold = .5;
  // 消融层
  snowThreshold += simplexNoise2d(vPosition.xz * 16.) * .1;
  float snowMix = step(snowThreshold, vPosition.y);
  color = mix(color, uColorSnow, snowMix);
  
  csm_DiffuseColor = vec4(color, 1.);
}