import { flattenBufferToArray, parseAttribute } from 'src/utils/parseAttribute';
import { GeometryDescriptor } from '../types/Geometry';

// TODO: Move this to somewhere else...

export interface GeometryBuilderAttribute {
  axis: number,
  data: number[],
}

export class GeometryBuilder {
  // The idea is to provide a vertex-oriented geometry object that can be
  // converted to OpenGL-compatible object. To go further, we can support
  // editing the geometry on demand, but that's completely unnecessary at the
  // moment.

  // OpenGL uses multiple vertices and single indices, but that's because
  // the indices only exist to save memory space - it's not for calculation.
  // This poses a lot of problem when doing operations on the geometry, for
  // example calculating tangent vectors and "hard" normals. For soft normals,
  // it's fine to use OpenGL-style indices. But, converting this objects to
  // hard normals requires completely recalculating the array because simply
  // OpenGL format isn't designed to calculate this.

  // Therefore, GeometryBuilder tries to convert this OpenGL-style geometries
  // to vertexs and faces, which can be helpful.
  // By storing faces's indices, we can quickly derive edges too.

  // ['aPosition', 'aNormal', 'aTexCoord']
  attributeNames: Map<string, number>;

  // [[[0, 0, 1], [0, 1, 1], [2, 2, 2], ...], ...]
  attributes: GeometryBuilderAttribute[];

  // faces -> vertexes -> attribute indices
  // [[[0, 0], [1, 0], [1, 1]], ...]
  faces: number[][][];

  constructor() {
    this.attributeNames = new Map();
    this.attributes = [];
    this.faces = [];
  }

  clear() {
    this.attributeNames = new Map();
    this.attributes = [];
    this.faces = [];
  }

  fromGeometry(geometry: GeometryDescriptor): void {
    // Parse each attribute and dump its data
    this.clear();
    let attributeSize: number = 0;
    Object.keys(geometry.attributes).forEach((name) => {
      const attribute = parseAttribute(geometry.attributes[name]);
      const index = this.attributes.length;
      this.attributeNames.set(name, index);
      // Convert data into attributes 3D array
      const buffer = flattenBufferToArray(attribute.data);
      this.attributes.push({ axis: attribute.axis, data: buffer });
      attributeSize = attribute.data.length / attribute.axis;
    });
    // Then, insert the indices
    if (geometry.indices != null) {
      const { indices } = geometry;
      const faces: number[][][] = [];
      const numAttributes = this.attributes.length;
      for (let i = 0; i < indices.length; i += 3) {
        const edges: number[][] = [];
        for (let j = 0; j < 3; j += 1) {
          const attributeIndices: number[] = [];
          for (let k = 0; k < numAttributes; k += 1) {
            attributeIndices.push(indices[i + j]);
          }
          edges.push(attributeIndices);
        }
        faces.push(edges);
      }
      this.faces = faces;
    } else {
      // If indices did not exist, we create it anyway.
      const faces: number[][][] = [];
      const numAttributes = this.attributes.length;
      for (let i = 0; i < attributeSize; i += 3) {
        const edges: number[][] = [];
        for (let j = 0; j < 3; j += 1) {
          const attributeIndices: number[] = [];
          for (let k = 0; k < numAttributes; k += 1) {
            attributeIndices.push(i + j);
          }
          edges.push(attributeIndices);
        }
        faces.push(edges);
      }
      this.faces = faces;
    }
  }
}
