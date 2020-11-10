export class GeometryBuffer {
  gl: WebGLRenderingContext;

  buffer: WebGLBuffer | null = null;

  indexBuffer: WebGLBuffer | null = null;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }
}
