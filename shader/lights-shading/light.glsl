vec3 ambientLight(vec3 color, float intensity) {
  return color * intensity;
}

vec3 directionalLight(vec3 color, float intensity, float specularPower, vec3 lightPosition, vec3 normal, vec3 viewDirection) {
  vec3 lightDirction = normalize(lightPosition);
  vec3 lightReflction = reflect(- lightDirction, normal);

  // Shading
  float shading = dot(lightDirction, normal);
  shading = max(shading, 0.);

  // Specular
  float specular = dot(lightReflction, viewDirection);
  specular = max(specular, 0.);
  specular = pow(specular, specularPower);

  return color * intensity * (shading + specular);
}

vec3 pointLight(vec3 color, float intensity, float specularPower, float lightDecay, vec3 lightPosition, vec3 normal, vec3 viewDirection, vec3 position) {
  vec3 lightDleta = lightPosition - position;
  float lightDistance = length(lightDleta);
  vec3 lightDirction = normalize(lightDleta);
  vec3 lightReflction = reflect(-lightDirction, normal);

  // Shading
  float shading = dot(lightDirction, normal);
  shading = max(shading, 0.);

  // Specular
  float specular = dot(lightReflction, viewDirection);
  specular = max(specular, 0.);
  specular = pow(specular, specularPower);

  // Decay
  float decay = 1. - lightDistance * lightDecay;
  decay = max(decay, 0.);

  return color * intensity * decay * (shading + specular);
}