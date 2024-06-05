uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

void main() {
  vec2 smokeUv = vUv;
  smokeUv.x *= .5;
  smokeUv.y *= .3;
  smokeUv.y -= uTime * .03;

  float smoke = texture(uPerlinTexture, smokeUv).r;
  // Remap
  smoke = smoothstep(.4, 1., smoke);
  // Edges
  smoke *= smoothstep(0., .2, vUv.x);
  smoke *= smoothstep(1., .8, vUv.x);
  smoke *= smoothstep(0., .1, vUv.y);
  smoke *= smoothstep(1., .4, vUv.y);

  vec3 color = vec3(1.);

  gl_FragColor = vec4(color, smoke);

  // three.js fragment file
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}