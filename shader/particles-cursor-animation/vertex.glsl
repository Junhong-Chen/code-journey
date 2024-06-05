uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;

attribute float aIntercity;
attribute float aAngle;

varying vec3 vColor;

void main()
{
  vec3 _position = position;

  // Displacement
  float displacementIntencity = texture(uDisplacementTexture, uv).r;
  // 第一个值抵消 globalAlpha 属性导致画布（uDisplacementTexture）颜色无法恢复到黑色的影响，第二个值使粒子动画有悬停效果
  displacementIntencity = smoothstep(.1, .5, displacementIntencity);
  vec3 displacement = vec3(cos(aAngle), sin(aAngle), sign(aIntercity - .5));
  displacement *= displacementIntencity;
  displacement *= aIntercity; // 增加位移的随机性

  _position += displacement;

  // Final position
  vec4 modelPosition = modelMatrix * vec4(_position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  // Pictures
  float pictureIntensity = texture(uPictureTexture, uv).r;

  // Point size
  gl_PointSize = 0.04 * pictureIntensity * uResolution.y;
  gl_PointSize *= (1.0 / - viewPosition.z);

  // Varying
  vColor = vec3(pow(pictureIntensity, 2.));
}