import { flattenBufferToArray, parseAttribute } from './utils/parseAttribute';
import { GeometryAttribute, GeometryDescriptor } from './types';

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
  attributeNames: string[];

  // [[[0, 0, 1], [0, 1, 1], [2, 2, 2], ...], ...]
  attributes: GeometryBuilderAttribute[];

  // faces -> vertexes -> attribute indices
  // [[[0, 0], [1, 0], [1, 1]], ...]
  faces: number[][][];

  constructor() {
    this.attributeNames = [];
    this.attributes = [];
    this.faces = [];
  }

  clear() {
    this.attributeNames = [];
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
      this.attributeNames[index] = name;
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

  toGeometry(): GeometryDescriptor {
    // Convert separated attributes / indices into one.
    // Basically, a new attribute has to be written for each attribute pair.
    const outputAttributes: number[][] = this.attributes.map(() => []);
    const outputIndices: number[] = [];
    let offset = 0;
    // We can find a pair using string, but, since 0th attribute (aPosition)
    // will almost never overlap, Maintaining linked list inside each
    // attribute would be much, much better.
    const attributeCache: [number, number][][] = [];
    const attributeLengths = this.attributes.map((v) => v.data.length / v.axis);
    this.faces.forEach((face) => {
      // Unwrap the face; map each pair to indices value
      const points = face.map((indices) => {
        // Retrieve "index key" which is used to find same value
        const indexKey = indices
          .reduce((p, v, i) => p * attributeLengths[i] + v, 0);
        let cacheEntry = attributeCache[indices[0]];
        if (cacheEntry == null) {
          // Initialize cache entry if not exists
          cacheEntry = [];
          attributeCache[indices[0]] = cacheEntry;
        }
        // Try to find matching value, if any
        const pair = cacheEntry.find((v) => v[0] === indexKey);
        if (pair != null) return pair[1];
        // Otherwise, register the attribute
        const currentOffset = offset;
        this.attributes.forEach((attribute, i) => {
          const attributeOutput = outputAttributes[i];
          const { data, axis } = attribute;
          const outputOffset = currentOffset * axis;
          const inputOffset = indices[i] * axis;
          for (let j = 0; j < axis; j += 1) {
            attributeOutput[outputOffset + j] = data[inputOffset + j];
          }
        });
        offset += 1;
        return currentOffset;
      });
      // Then, register all points as triangles (Do we need to support other
      // than triangles?)
      for (let i = 1; i < points.length - 1; i += 1) {
        outputIndices.push(points[0]);
        outputIndices.push(points[i]);
        outputIndices.push(points[i + 1]);
      }
    });
    // Finally, generate geometry descriptor from this
    const attributesMap: { [key: string]: GeometryAttribute } = {};
    this.attributes.forEach((attribute, i) => {
      const name = this.attributeNames[i];
      attributesMap[name] = {
        data: outputAttributes[i],
        axis: attribute.axis,
      };
    });
    return {
      attributes: attributesMap,
      indices: outputIndices,
    };
  }

  getAttribute(name: string): GeometryBuilderAttribute | null {
    const index = this.attributeNames.indexOf(name);
    if (index === -1) return null;
    return this.attributes[index];
  }

  clearAttributes(names: string[], axises: number[]): void {
    this.attributeNames = names;
    this.attributes = axises.map((v) => ({
      data: [],
      axis: v,
    }));
  }

  addAttribute(index: number, value: number[]): void {
    const attribute = this.attributes[index];
    for (let i = 0; i < value.length; i += 1) {
      attribute.data.push(value[i]);
    }
  }

  addFace(vertexes: number[][]): void {
    this.faces.push(vertexes);
  }

  clearFaces(): void {
    this.faces = [];
  }
}
