import {
  convertFloat,
  convertFloatArray,
  convertInt,
  convertIntArray,
} from '../utils/uniform';
import { Shader } from '../Shader';
import { RenderSystem } from '../systems/RenderSystem';

export interface UniformType {
  name: string,
  size: number,
  glType: number,
  type: 'uniform',
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
  const regex = /(?:^|\.)(\w+)|\[(\d+)\]/g;
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
    // Assert the map to have same type as the token. This would require
    // generics, so we'll just forcefully convert them to strings for now
    const currentEntry = current as UniformEntryObject;
    const currentToken = token as unknown as string;
    if (i < tokens.length - 1) {
      const nextToken = tokens[i + 1];
      // Initialize store to be same type as next token.
      let nextEntry = currentEntry.map.get(currentToken);
      const nextType = typeof nextToken === 'string'
        ? 'object' as const
        : 'array' as const;
      if (nextEntry == null) {
        const newEntry = { type: nextType, map: new Map() };
        currentEntry.map.set(currentToken, newEntry);
        nextEntry = newEntry;
      }
      if (nextEntry != null && nextEntry.type !== nextType) {
        throw new Error(`${token} type conflicts`);
      }
      current = nextEntry as UniformEntryObject | UniformEntryArray;
    } else {
      currentEntry.map.set(currentToken, type);
    }
  }
}

export class ShaderBuffer {
  gl: WebGLRenderingContext;

  program: WebGLProgram | null = null;

  shaders: WebGLShader[] = [];

  uniforms: UniformEntryObject = { type: 'object', map: new Map() };

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
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vertShader)!);
    }
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, shader.fragShader);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fragShader)!);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program)!);
    }

    this.program = program;
    this.version = shader.version;
    this.shaders = [vertShader, fragShader];

    // Read uniform, attributes information
    const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    this.uniforms = { type: 'object', map: new Map() };
    for (let i = 0; i < nUniforms; i += 1) {
      const uniform = gl.getActiveUniform(program, i)!;
      if (uniform.size > 1) {
        // An array has been received; in this case WebGL only offers single
        // position ([0]). We map each array value to an uniform.
        for (let j = 0; j < uniform.size; j += 1) {
          const newName = `${uniform.name.slice(0, -3)}[${j}]`;
          storeUniform(newName, {
            location: gl.getUniformLocation(program, newName)!,
            name: newName,
            size: 1,
            glType: uniform.type,
            type: 'uniform',
          }, this.uniforms);
        }
      } else {
        const loc = gl.getUniformLocation(program, uniform.name)!;
        storeUniform(uniform.name, {
          location: loc,
          name: uniform.name,
          size: uniform.size,
          glType: uniform.type,
          type: 'uniform',
        }, this.uniforms);
      }
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

  _setUniforms(
    renderSystem: RenderSystem,
    uniforms: unknown,
    entry: UniformEntry,
  ): void {
    switch (entry.type) {
      case 'uniform': {
        const { gl } = this;
        const value = uniforms as unknown;
        // Assert the array according to the uniform's type.
        switch (entry.glType) {
          case gl.FLOAT:
            gl.uniform1f(entry.location, convertFloat(value));
            break;
          case gl.FLOAT_VEC2:
            gl.uniform2fv(entry.location, convertFloatArray(value, 2));
            break;
          case gl.FLOAT_VEC3:
            gl.uniform3fv(entry.location, convertFloatArray(value, 3));
            break;
          case gl.FLOAT_VEC4:
            gl.uniform4fv(entry.location, convertFloatArray(value, 4));
            break;
          case gl.FLOAT_MAT2:
            gl.uniformMatrix2fv(
              entry.location,
              false,
              convertFloatArray(value, 4),
            );
            break;
          case gl.FLOAT_MAT3:
            gl.uniformMatrix3fv(
              entry.location,
              false,
              convertFloatArray(value, 9),
            );
            break;
          case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(
              entry.location,
              false,
              convertFloatArray(value, 16),
            );
            break;
          case gl.INT_VEC2:
          case gl.BOOL_VEC2:
            gl.uniform2iv(entry.location, convertIntArray(value, 2));
            break;
          case gl.INT_VEC3:
          case gl.BOOL_VEC3:
            gl.uniform3iv(entry.location, convertIntArray(value, 3));
            break;
          case gl.INT_VEC4:
          case gl.BOOL_VEC4:
            gl.uniform4iv(entry.location, convertIntArray(value, 4));
            break;
          case gl.BOOL:
          case gl.BYTE:
          case gl.UNSIGNED_BYTE:
          case gl.SHORT:
          case gl.UNSIGNED_SHORT:
          case gl.INT:
          case gl.UNSIGNED_INT:
            gl.uniform1i(entry.location, convertInt(value));
            break;
          case gl.SAMPLER_2D:
          case gl.SAMPLER_CUBE: {
            // Try to find the entity with given ID - however, if the texture
            // is missing, we need to use "placeholder" texture.
            // TODO Support placeholder texture
            if (typeof value !== 'number') break;
            const texture = renderSystem.getTextureBufferById(value);
            if (texture == null) break;
            const pos = renderSystem.bindTexture(texture);
            gl.uniform1i(entry.location, pos);
            break;
          }
          default:
            throw new Error('Unsupported type');
        }
        break;
      }
      case 'object': {
        if (typeof uniforms !== 'object') throw new Error('Type mismatch');
        const uniformMap = uniforms as { [key: string]: unknown };
        const entryMap = entry.map;
        // Try to map uniforms object into key-value store.
        Object.keys(uniformMap).forEach((key) => {
          const value = uniformMap[key];
          const child = entryMap.get(key);
          if (child == null) return;
          this._setUniforms(renderSystem, value, child);
        });
        break;
      }
      case 'array': {
        if (!Array.isArray(uniforms)) throw new Error('Type mismatch');
        const entryMap = entry.map;
        uniforms.forEach((value, key) => {
          const child = entryMap.get(key);
          if (child == null) return;
          this._setUniforms(renderSystem, value, child);
        });
        break;
      }
      default:
    }
  }

  setUniforms(
    renderSystem: RenderSystem,
    uniforms: unknown,
  ): void {
    this._setUniforms(renderSystem, uniforms, this.uniforms);
  }
}
