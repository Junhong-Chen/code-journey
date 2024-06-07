uniform sampler2D uTextureDay;
uniform sampler2D uTextureNight;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float createSpecular(vec3 normal, vec3 lightDirection, vec3 viewDirection) {
    vec3 reflection = reflect(lightDirection, normal);
    float specular = -dot(reflection, viewDirection);
    specular = max(0., specular);
    specular = pow(specular, 64.);
    return specular;
}

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.);

    vec3 dayColor = texture(uTextureDay, vUv).rgb;
    vec3 nightColor = texture(uTextureNight, vUv).rgb;

    float sunOrientation = dot(normal, uSunDirection);
    float surfaceMix = smoothstep(-.25, .5, sunOrientation);
    color = mix(nightColor, dayColor, surfaceMix);

    // Clouds
    vec2 specularCloudsTexture = texture(uSpecularCloudsTexture, vUv).rg; // r 海洋 / g 云层
    float cloudsMix = smoothstep(.5, 1., specularCloudsTexture.g);
    color = mix(color, vec3(surfaceMix), cloudsMix); // 隐藏阴影面的云朵

    // Fresnel
    float fresnel = dot(viewDirection, normal) + 1.; // -1 ~ 1 => 0 ~ 2
    fresnel = pow(fresnel, 2.);

    // Atmosphere
    float atmosphereMix = smoothstep(-.5, 1., sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereMix);
    color = mix(color, atmosphereColor, fresnel * atmosphereMix);
    
    // Specular
    float specular = createSpecular(normal, -uSunDirection, viewDirection);
    vec3 specularColor = mix(vec3(1.), atmosphereColor, fresnel); // 当镜面光照接近边缘时，让其颜色接近大气层颜色
    specular *= specularCloudsTexture.r; // 只在海洋中反射光照
    color += specularColor * specular;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}