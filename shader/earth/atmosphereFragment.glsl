uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.);

    float sunOrientation = dot(normal, uSunDirection);

    // Atmosphere
    float atmosphereMix = smoothstep(-.5, 1., sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereMix);
    color = mix(color, atmosphereColor, atmosphereMix);

    // Alpha
    float edgeAlpha = dot(normal, viewDirection);
    edgeAlpha = smoothstep(0., .5, edgeAlpha);
    
    float dayAlpha = smoothstep(-.5, 0., sunOrientation);
    float alpha = edgeAlpha * dayAlpha;
    
    // Final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}