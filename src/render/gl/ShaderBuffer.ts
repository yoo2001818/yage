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

export interface UniformEntryObject {
  type: 'object',
  map: Map<string, UniformEntry>,
}

export interface UniformEntryArray {
  type: 'array',
  map: Map<number, UniformEntry>,
}

export type UniformEntry = UniformType | UniformEntryObject | UniformEntryArray;

function getTokenType(type: string | number): 'object' | 'array' {
  if (typeof type === 'string') return 'object';
  return 'array';
}

function storeUniform(
  name: string,
  type: UniformType,
  output: UniformEntry,
): void {
  // Parse uniform name. The uniform name is separated using [] and .
  // For example: abc.def[1].g
  // abc .def [1] .g
  // first = \s
  // keyword = '.' \s
  // list = '[' \d ']'
  // attr = keyword | list
  // name = first attr+
  //
  // Considering this in mind, we can build a parser like...
  const regex = /(?:^|\.)(\s+)|\[(\d+)\]/g;
  // This way, we can convert the name to list of tokens.
  let match;
  const tokens: (string | number)[] = [];
  // eslint-disable-next-line no-cond-assign
  while (match = regex.exec(name)) {
    if (match[1] != null) {
      tokens.push(match[1]);
    } else if (match[2] != null) {
      tokens.push(parseInt(match[2], 10));
    }
  }
  let current: UniformEntry = output;
  // Using the tokens, we recursively step into the given value...
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (i < tokens.length - 1) {
      const nextToken = tokens[i + 1];
    } else {
      const expectedType = getTokenType(token);
      if (current.type !== expectedType) throw new Error('...');
      current.map.set(token, output);
    }
  }
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

  setUniforms(uniforms: { [key: string]: unknown }, prefix = ''): void {
    // Try to map uniforms object into key-value store.
    for (const key in uniforms) {
      if (Object.prototype.hasOwnProperty.call(uniforms, key)) {
        const entry = uniforms[key];
        // Entry can be...
        // an array containing other arrays, e.g. [Float32Array, Float32Array]
        // an object
        // an array containing object
        // etc....
        // We have to map these to 'a.b.c[1].d'.
        // It'd be better to make key-value list to a tree - that way we can
        // throw an error if we can't traverse to the node.
      }
    }
  }
}
