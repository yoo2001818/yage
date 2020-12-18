#version 100
precision lowp float;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;
// Instanced
attribute mat4 aModel;

uniform mat4 uView;
uniform mat4 uProjection;
// uniform mat4 uModel;
uniform vec4 uColor;

varying lowp vec3 vPosition;
varying lowp vec2 vTexCoord;
varying lowp vec3 vViewPos;
varying lowp vec3 vNormal;

vec3 getViewPosWorld() {
  return -mat3(
    uView[0].x, uView[1].x, uView[2].x,
    uView[0].y, uView[1].y, uView[2].y,
    uView[0].z, uView[1].z, uView[2].z
    ) * uView[3].xyz;
}

void main() {
  vec4 fragPos = aModel * vec4(aPosition, 1.0);
  gl_Position = uProjection * uView * fragPos;
  vTexCoord = aTexCoord;
  vPosition = fragPos.xyz;
  // NOTE: This is not mathmatically accurate
  mat3 normalMat = mat3(aModel[0].xyz, aModel[1].xyz, aModel[2].xyz);
  vNormal = normalMat * aNormal;
  vViewPos = getViewPosWorld();
}
