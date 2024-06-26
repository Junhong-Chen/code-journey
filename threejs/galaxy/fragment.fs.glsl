precision mediump float;

varying vec3 vColor;

void main() {
  float strength = distance(gl_PointCoord, vec2(.5));
  strength = 1.0 - strength;
  strength = pow(strength, 4.0);

  vec3 color = mix(vec3(0.), vColor, strength);

  gl_FragColor = vec4(color, 1.);
}