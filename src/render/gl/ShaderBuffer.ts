import { Shader } from '../Shader';

export class ShaderBuffer {
  gl: WebGLRenderingContext;

  program: WebGLProgram | null = null;

  shaders: WebGLShader[] = [];

  version: number = -1;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  sync(shader: Shader): void {
    const { gl } = this;
    if (shader.version === this.version) return;
    if (this.program != null) {
      // Destroy previous program
      gl.deleteProgram(this.program);
      this.shaders.forEach((v) => {
        gl.deleteShader(v);
      });
    }

    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, shader.vertShader);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, shader.fragShader);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program)!);
    }

    this.program = program;
    this.shaders = [vertShader, fragShader];

    // Read uniform, attributes information
  }
}
