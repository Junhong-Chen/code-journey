#include ./light

uniform vec3 uColor;
uniform vec3 uDirectionalLightColor;
uniform vec3 uDirectionalLightPosition;
uniform vec3 uPointColor;
uniform vec2 uResolution;
uniform float uRepetitions;

varying vec3 vNormal;
varying vec3 vPosition;

vec3 halftone(vec3 color, vec3 pointColor, float low, float high, vec3 normal, vec3 direction) {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv = mod(uv * uRepetitions, 1.);
    
    float intensity = dot(normal, direction);
    intensity = smoothstep(low, high, intensity);

    float point = distance(uv, vec2(.5));
    point = mod(point * 10., 1.);
    point = step(point, .5 * intensity);

    return mix(color, pointColor, point);
}

void main()
{
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = uColor;

    // Lights
    vec3 light = vec3(0.0);
    light += ambientLight(vec3(1.), .02);
    light += directionalLight(uDirectionalLightColor, 1., 20., uDirectionalLightPosition, normal, viewDirection);
    color *= light;

    // Halftone
    color = halftone(color, uPointColor, -.8, 1.6, normal, vec3(-1., -1., 0.));
    color = halftone(color, uDirectionalLightColor, 0.4, 1.6, normal, normalize(uDirectionalLightPosition));

    // Final color
    gl_FragColor = vec4(vec3(color), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}