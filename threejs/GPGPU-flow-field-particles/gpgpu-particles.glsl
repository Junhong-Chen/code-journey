#include ./simplex4DNoise
// uniform sampler2D uParticles; // 添加的计算变量已默认申明，所以这里不需要再申明
uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform float uFlowFieldInfluence;
uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency;
uniform vec3 uCursor;

void main()
{
  float time = uTime * .2;

  // 像素坐标 / 分辨率 得到 uv
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture(uParticles, uv);
  vec4 base = texture(uBase, uv);

  // 使用 Alpha 通道来模拟粒子的生命周期  
  if (particle.a >= 1.) {
    particle.xyz = base.xyz;
    // 如果写成 particle.a = 0，用户在切换浏览器标签时，标签中的动画会被暂停，但 particle.a 还在被累加，当用户停留足够长的时间在切换回来时，所有粒子的 particle.a 都会大于 1 然后被重新赋值，如果赋值为 0，就会导致粒子的动画又趋于一致。
    // 也可以使用 fract 函数，fract 函数返回数值中的小数部分
    particle.a = mod(particle.a, 1.);
  } else {
    // 利用噪声函数，使只有部分粒子进行运动
    float strength = simplex4DNoise(vec4(base.xyz, time));
    // 噪声函数一般会返回 -1 ~ 1 的值，这里使 influence 之前的值都保持为 0，也就意味着值在这个范围内的粒子保持不动
    float influence = (uFlowFieldInfluence - .5) * -2.; // 0 ~ 1 => 1 ~ -1
    strength = smoothstep(influence, 1., strength);
    // 鼠标悬停在模型上时运动其周围的粒子
    float cursorDistance = distance(particle.xyz, uCursor);
    float around = smoothstep(2., 0., cursorDistance);

    // Flow field
    vec3 flowFiled = vec3(
      simplex4DNoise(vec4(particle.xyz * uFlowFieldFrequency + 0., time)),
      simplex4DNoise(vec4(particle.xyz * uFlowFieldFrequency + 1., time)),
      simplex4DNoise(vec4(particle.xyz * uFlowFieldFrequency + 2., time))
    );
    // 流场仅用于表示粒子的运动的方向
    flowFiled = normalize(flowFiled);
    particle.xyz += flowFiled * uDeltaTime / 2. * strength * uFlowFieldStrength * around;

    particle.a += uDeltaTime / 4.;
  }

  gl_FragColor = particle;
}