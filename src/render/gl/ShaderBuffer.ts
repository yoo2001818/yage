import { Shader } from '../Shader';

export interface UniformType {
  name: string,
  size: number,
  type: number,
  location: WebGLUniformLocation,
}

export interface AttributeType {
  name: string,
  size: number,
  type: number,
  location: number,
}

export class ShaderBuffer {
  gl: WebGLRenderingContext;

  program: WebGLProgram | null = null;

  shaders: WebGLShader[] = [];

  uniforms: Map<string, UniformType> = new Map();

  attributes: Map<string, AttributeType> = new Map();

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
    const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    this.uniforms = new Map();
    for (let i = 0; i < nUniforms; i += 1) {
      const uniform = gl.getActiveUniform(program, i)!;
      const loc = gl.getUniformLocation(program, uniform.name)!;
      this.uniforms.set(uniform.name, {
        location: loc,
        name: uniform.name,
        size: uniform.size,
        type: uniform.type,
      });
    }

    const nAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    this.attributes = new Map();
    for (let i = 0; i < nAttributes; i += 1) {
      const attribute = gl.getActiveAttrib(program, i)!;
      const loc = gl.getAttribLocation(program, attribute.name);

      this.attributes.set(attribute.name, {
        location: loc,
        name: attribute.name,
        size: attribute.size,
        type: attribute.type,
      });
    }
  }

  bind(): void {
    const { gl } = this;
    gl.useProgram(this.program);
  }
}
