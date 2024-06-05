#include ./remap

// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uResolution;
uniform float uProgress;
uniform vec3[3] uColors;

attribute float aSize;
attribute float aTimeMultiplier;
attribute float aColorRandomness;

varying vec3 vColor;

void main() {
  vec3 _position = position;
  float progress = uProgress * aTimeMultiplier;

  // Exploding
  float explodingProgress = remap(progress, .0, .1, 0., 1.);
  explodingProgress = 1. - pow(1. - explodingProgress, 3.);
  _position *= explodingProgress;

  // Falling
  float fallingProgress = remap(progress, .1, 1., 0., 1.);
  fallingProgress = 1. - pow(1. - fallingProgress, 3.);
  _position.y -= fallingProgress * .2;

  // Scaling
  float sizeOpeningProgress = remap(progress, .0, .125, 0., 1.);
  float sizeClosingProgress = remap(progress, .125, 1., 1., 0.);
  sizeOpeningProgress = sizeOpeningProgress >= 1. ? 0. : sizeOpeningProgress;
  float sizeProgress = max(sizeOpeningProgress, sizeClosingProgress);

  // Twinkling
  float twinklingProgres = remap(progress, .2, .8, 0., 1.);
  float sizeTwinkling = (sin(progress * 30.) + 1.) / 2.; // -1 ~ 1 => 0 ~ 1
  sizeTwinkling = 1. - sizeTwinkling * twinklingProgres; // 避免在开始时 twinklingProgres 为 0 导致 size 也为 0

  vec4 modelPosition = modelMatrix * vec4(_position, 1.);
  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  gl_PointSize = uSize * aSize * uPixelRatio * uResolution.y * sizeProgress * sizeTwinkling;
  gl_PointSize *= 1. / - viewModelPosition.z;

  if (gl_PointSize < 1.)
    gl_Position = vec4(9999.9); // 当粒子大小小于 1 时，windowsOS 仍将其渲染为 1 个像素，故将其移出可视范围

  vColor = uColors[int(aColorRandomness)];
}