uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vWobble;

void main() {
  float colorMix = smoothstep(-1., 1., vWobble); // -1 ~ 1 => 0 ~ 1
  csm_DiffuseColor.rgb = mix(uColorA, uColorB, colorMix);

  // Mirror step
  // csm_Metalness = step(.25, vWobble);
  // csm_Roughness = 1. - csm_Metalness;

  // Shinny tip
  csm_Roughness = 1. - colorMix;
}