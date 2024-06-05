uniform sampler2D uTexture;

varying vec3 vColor;

void main() {
  float textureAlpha = texture(uTexture, gl_PointCoord).r;

  gl_FragColor = vec4(vColor, textureAlpha);

  // three.js fragment file
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}