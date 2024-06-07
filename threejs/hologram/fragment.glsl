uniform float uTime;
uniform vec3 uColor;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  float stripes = pow(mod(vPosition.y * 20. - uTime, 1.), 3.);

  // Fresnel
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vPosition - cameraPosition);
  float fresnel = dot(viewDirection, normal);
  fresnel = -abs(fresnel) + 1.; // -1 ~ 1 => 0 ~ 1 ~ 0
  fresnel = pow(fresnel, 2.);

  // Falloff
  float falloff = smoothstep(.8, .0, fresnel);

  // Holographic
  float holographic = stripes * fresnel;
  holographic += fresnel * 1.25;
  holographic *= falloff;

  gl_FragColor = vec4(uColor, holographic);

  // three.js fragment file
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}