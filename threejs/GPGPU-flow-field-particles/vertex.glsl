uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;

varying vec3 vColor;

attribute vec2 aParticlesUv;
attribute float aSize;
attribute vec3 aColor;

void main()
{
  vec4 particle = texture(uParticlesTexture, aParticlesUv);
  vec3 _position = particle.xyz;

  // Final position
  vec4 modelPosition = modelMatrix * vec4(_position, 1.);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  // 当粒子运动生命周期开始时 size 逐渐变大，当生命周期即将结束时 size 逐渐变小。
  float sizeIn = smoothstep(.0, .1, particle.a);
  float sizeOut = smoothstep(1., .7, particle.a);
  float size = min(sizeIn, sizeOut);

  // Point size
  gl_PointSize = size * aSize * uSize * uResolution.y;
  gl_PointSize *= (1. / - viewPosition.z);

  vColor = aColor;
}