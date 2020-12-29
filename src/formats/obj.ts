import { Mesh } from '../render/Mesh';
import { Material } from '../render/Material';
import { GeometryDescriptor } from '../types/Geometry';

export interface ObjEntity {
  pos: number[],
  geometry: GeometryDescriptor,
  material: Material,
  mesh: Mesh,
}

export function parseObj(input: string): ObjEntity[] {
  input.split('\n').forEach((line) => {
    if (line[0] === '#') return;
    const words = line.split(/\s+/g);
    // o -> Object
    // v -> aPosition
    // vt -> aTexCoord
    // vn -> aNormal
    // vp -> Not sure
    // f -> Indices
    // mtllib
    // usemtl
    // s off -> Normal smoothing
  });
}
