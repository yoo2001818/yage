import { Mesh } from '../render/Mesh';
import { Material } from '../render/Material';
import {
  ChannelGeometryDescriptor,
  GeometryDescriptor,
} from '../types/Geometry';

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
    let positions: number[][] = [];
    let normals: number[][] = [];
    let texCoords: number[][] = [];
    switch (words[0]) {
      case 'v': {
        // Vertex coords: v 0 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        const z = parseFloat(words[3]);
        positions.push([x, y, z]);
        break;
      }
      case 'vn': {
        // Normals: vn 0 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        const z = parseFloat(words[3]);
        normals.push([x, y, z]);
        break;
      }
      case 'vt': {
        // TexCoords: vt 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        texCoords.push([x, y]);
        break;
      }
      case 'p':
        // Point
        break;
      case 'l':
        // Line
        break;
      case 'f':
        // Face: f 0/0/0 0/0/0 0/0/0
        // Arbitrary amount of points are possible; we must triangluate them
        break;
      case 'o':
        // Finalize object if exists; otherwise specify its name
        break;
      case 'usemtl':
        // Nothing yet..
        break;
      case 'g':
        // Put the object in group if exists
        break;
      case 's':
        // Smoothing: s off / s 0 / s on / s 1
        break;
      default:
    }
  });
}