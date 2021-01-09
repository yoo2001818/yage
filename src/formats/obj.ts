import { Mesh } from '../render/Mesh';
import { Material } from '../render/Material';
import GeometryBuilder from './GeometryBuilder';
import {
  GeometryDescriptor,
} from '../types/Geometry';

const POSITION = 0;
const NORMAL = 1;
const TEXCOORD = 2;

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
    let builder = new GeometryBuilder();
    builder.clearAttributes(['aPosition', 'aNormal', 'aTexCoord'], [3, 3, 2]);
    switch (words[0]) {
      case 'v': {
        // Vertex coords: v 0 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        const z = parseFloat(words[3]);
        builder.addAttribute(POSITION, [x, y, z]);
        break;
      }
      case 'vn': {
        // Normals: vn 0 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        const z = parseFloat(words[3]);
        builder.addAttribute(NORMAL, [x, y, z]);
        break;
      }
      case 'vt': {
        // TexCoords: vt 0 0
        const x = parseFloat(words[1]);
        const y = parseFloat(words[2]);
        builder.addAttribute(TEXCOORD, [x, y]);
        break;
      }
      case 'p':
        // Point
        break;
      case 'l':
        // Line
        break;
      case 'f': {
        // Face: f 0/0/0 0/0/0 0/0/0
        // Arbitrary amount of points are possible; we must triangluate them
        const points = words.slice(1).map((arg) => {
          const [pos, tex, normal] = arg.split('/');
          return [
            parseInt(pos, 10),
            parseInt(normal, 10),
            parseInt(tex, 10),
          ];
        });
        for (let i = 1; i < points.length - 1; i += 1) {
          builder.addFace([
            points[0],
            points[i],
            points[i + 1],
          ]);
        }
        break;
      }
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
