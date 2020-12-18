#version 100
precision lowp float;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;
varying lowp vec3 vViewPos;

lowp vec3 normal;
lowp vec3 fragPos;

struct Material {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;

  lowp float shininess;
};

struct MaterialColor {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;
};

struct PointLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;
};

uniform PointLight uPointLight[1];

uniform Material uMaterial;

uniform sampler2D uDiffuseMap;

lowp float gamma = 2.2;

// It's Blinn-Phong actually.
lowp vec3 calcPhong(lowp vec3 lightDir, lowp vec3 viewDir) {
  // Diffuse
  lowp float lambertian = max(dot(lightDir, normal), 0.0);

  // Specular
  lowp float spec = 0.0;
  lowp float fresnel = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, normal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
    fresnel = pow(1.0 - max(0.0, dot(halfDir, viewDir)), 5.0);
  }

  return vec3(lambertian, spec, fresnel);
}

lowp vec3 calcPoint(
  PointLight light, MaterialColor matColor, lowp vec3 viewDir
) {
  lowp vec3 lightDir = light.position - fragPos;

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  lowp vec3 phong = calcPhong(lightDir, viewDir);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += mix(matColor.specular, vec3(1.0), phong.z) *
    light.intensity.b * phong.y;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;
}

void main() {
  fragPos = vPosition;
  lowp vec3 viewDir = normalize(vViewPos - fragPos);
  normal = normalize(vNormal);

  lowp vec2 texCoord = vTexCoord;

  MaterialColor matColor;
  matColor.ambient = pow(uMaterial.ambient, vec3(gamma));
  matColor.diffuse = pow(uMaterial.diffuse, vec3(gamma));
  matColor.specular = pow(uMaterial.specular, vec3(gamma));

  lowp vec3 diffuseTex = pow(texture2D(uDiffuseMap, texCoord).xyz, vec3(gamma));
  matColor.ambient *= diffuseTex;
  matColor.diffuse *= diffuseTex;

  lowp vec3 result = vec3(0.0, 0.0, 0.0);

  for (int i = 0; i < 1; ++i) {
    result += calcPoint(uPointLight[i], matColor, viewDir);
  }
  
  gl_FragColor = vec4(pow(result, vec3(1.0 / gamma)), 1.0);
  // gl_FragColor = vec4(result, 1.0);
}
