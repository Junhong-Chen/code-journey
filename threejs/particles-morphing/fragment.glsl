varying vec3 vColor;

void main()
{
  vec2 uv = gl_PointCoord;
  float distanceToCenter = length(uv - vec2(.5));
  float alpha = max(.2 / distanceToCenter - .4, 0.);

  gl_FragColor = vec4(vColor, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}