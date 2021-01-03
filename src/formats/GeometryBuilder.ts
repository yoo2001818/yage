// TODO: Move this to somewhere else...

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
  attributeNames: Set<string>;

  // [[[0, 0, 1], [0, 1, 1], [2, 2, 2], ...], ...]
  attributes: number[][][];

  // faces -> vertexes -> attribute indices
  // [[[0, 0], [1, 0], [1, 1]], ...]
  faces: number[][][];

  constructor() {
    this.attributeNames = new Set();
    this.attributes = [];
    this.faces = [];
  }
}
