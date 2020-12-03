import { vec3 } from 'gl-matrix';

import { GeometryDescriptor } from '../types/Geometry';

import { parseAttribute, flattenBuffer } from '../utils/parseAttribute';
import { parseIndices } from '../utils/parseIndices';

export function calcNormals(
  geometry: GeometryDescriptor,
) {
  const vertices = parseAttribute(geometry.attributes.aPosition);
  if (vertices == null) throw new Error('aPosition must be specified');
  let normals: Float32Array;
  if (geometry.attributes.aNormal && 'data' in geometry.attributes.aNormal
    && geometry.attributes.aNormal.data.length === vertices.data.length
  ) {
    normals = flattenBuffer(geometry.attributes.aNormal.data);
  } else {
    normals = new Float32Array(vertices.data.length);
  }
  if (geometry.indices == null) throw new Error('Indices must be specified');
  const indices = parseIndices(geometry.indices);
  const pos = flattenBuffer(vertices.data);
  // Uh, maybe the variable names are too verbose. I think.
  for (let faceId = 0; faceId < indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    // Calculate normal vector.
    const origin = pos.slice(vertexId1 * 3, vertexId1 * 3 + 3);
    const p1 = vec3.create();
    const p2 = vec3.create();
    const uv = vec3.create();
    vec3.subtract(p1, pos.slice(vertexId2 * 3, vertexId2 * 3 + 3), origin);
    vec3.subtract(p2, pos.slice(vertexId3 * 3, vertexId3 * 3 + 3), origin);
    vec3.cross(uv, p1, p2);
    vec3.normalize(uv, uv);
    // Done! Paste them to those three vertices.
    normals[vertexId1 * 3] += uv[0];
    normals[vertexId1 * 3 + 1] += uv[1];
    normals[vertexId1 * 3 + 2] += uv[2];
    normals[vertexId2 * 3] += uv[0];
    normals[vertexId2 * 3 + 1] += uv[1];
    normals[vertexId2 * 3 + 2] += uv[2];
    normals[vertexId3 * 3] += uv[0];
    normals[vertexId3 * 3 + 1] += uv[1];
    normals[vertexId3 * 3 + 2] += uv[2];
  }
  // This isn't necessary for 'hard' normals, but whatever.
  for (let vertexId = 0; vertexId < normals.length; vertexId += 3) {
    const len = Math.sqrt(
      normals[vertexId] * normals[vertexId]
      + normals[vertexId + 1] * normals[vertexId + 1]
      + normals[vertexId + 2] * normals[vertexId + 2],
    );
    normals[vertexId] /= len;
    normals[vertexId + 1] /= len;
    normals[vertexId + 2] /= len;
  }
  return {
    ...geometry,
    attributes: {
      ...geometry.attributes,
      aNormal: { axis: 3, data: normals },
    },
  };
}
