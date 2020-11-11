export class ShaderBuffer {
  gl: WebGLRenderingContext;

  program: WebGLProgram | null = null;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }
}
