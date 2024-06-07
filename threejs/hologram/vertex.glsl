#include ./random

// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.);

  // Glitch
  float glitchTime = uTime - modelPosition.y;
  float giltchStrength = (sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76)) / 3.; // 添加一些随机要素
  giltchStrength = smoothstep(.3, 1., giltchStrength); // 只在 0.3 ~ 1.0 范围内生成故障动画
  giltchStrength *= .1;
  modelPosition.x += (random(modelPosition.xz + uTime) - .5) * giltchStrength;
  modelPosition.z += (random(modelPosition.zx + uTime) - .5) * giltchStrength;

  vec4 viewModelPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewModelPosition;

  vPosition = modelPosition.xyz;
  vNormal = (modelMatrix * vec4(normal, 0.)).xyz;
}