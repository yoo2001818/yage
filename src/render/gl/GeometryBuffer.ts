import { Geometry } from '../Geometry';
import { ShaderBuffer } from './ShaderBuffer';

interface BufferEntry {
  buffer: WebGLBuffer | null,
  version: number,
}

export class GeometryBuffer {
  gl: WebGLRenderingContext;

  buffers: Map<string, BufferEntry> = new Map();

  indexBuffers: Map<string, BufferEntry> = new Map();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  sync(geometry: Geometry): void {
    // Try to read version data from geometry and run diff.
    geometry.attributes.forEach((entry, key) => {
      let bufferEntry = this.buffers.get(key);
      // Create new buffer if needed
      if (bufferEntry == null) {
        bufferEntry = {
          buffer: this.gl.createBuffer(),
          version: -1,
        };
        this.buffers.set(key, bufferEntry);
      }
      // Upload the data...
      if (bufferEntry.version !== entry.version) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferEntry.buffer);
        // TODO: Allow subData, and allow usage type
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          entry.array,
          this.gl.STATIC_DRAW,
        );
      }
    });
    // Then the indices
    geometry.indices.forEach((entry, key) => {
      let bufferEntry = this.buffers.get(key);
      // Create new buffer if needed
      if (bufferEntry == null) {
        bufferEntry = {
          buffer: this.gl.createBuffer(),
          version: -1,
        };
        this.buffers.set(key, bufferEntry);
      }
      // Upload the data...
      if (bufferEntry.version !== entry.version) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, bufferEntry.buffer);
        // TODO: Allow subData, and allow usage type
        this.gl.bufferData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          entry.array,
          this.gl.STATIC_DRAW,
        );
      }
    });
  }

  bind(shaderBuffer: ShaderBuffer): void {
    // Using shaderBuffer's attribute information, we have to map the buffers
    // to attribute location
  }
}
