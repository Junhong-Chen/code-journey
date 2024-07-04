uniform sampler2D tDiffuse;
uniform sampler2D uNormalMap;

varying vec2 vUv;

void main() {
  vec3 normalColor = texture2D(uNormalMap, vUv).rgb * 2. - 1.; // 0 ~ 1 => -1 ~ 1

  vec2 newUv = vUv + normalColor.rg * .1;
  vec4 color = texture2D(tDiffuse, newUv);

  vec3 lightDirection = normalize(vec3(-1., 1., 0.)); // 定义一个光源方向
  float lightness = clamp(dot(normalColor, lightDirection), 0., 1.); // 计算法线与光源的点乘（点能否接受到光线）
  color.rgb += lightness * 2.;

  gl_FragColor = color;
}