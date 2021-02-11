export interface Light {
  type: 'point' | 'directional' | 'spot',
  color: number[],
  ambient: number,
  diffuse: number,
  specular: number,
  attenuation: number,
  angle: number[],
}
