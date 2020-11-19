import { Geometry } from '../Geometry';
import { ShaderBuffer } from './ShaderBuffer';

interface BufferEntry {
  buffer: WebGLBuffer | null,
  size: number,
  version: number,
}

export class GeometryBuffer {
  gl: WebGLRenderingContext;

  buffers: Map<string, BufferEntry> = new Map();

  elements: BufferEntry | null = null;

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
          size: 0,
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
        bufferEntry.size = entry.array.length;
        bufferEntry.version = entry.version;
      }
    });
    // Then the elements
    if (geometry.elements != null) {
      const entry = geometry.elements;
      if (this.elements == null) {
        this.elements = {
          buffer: this.gl.createBuffer(),
          size: 0,
          version: -1,
        };
      }
      const bufferEntry = this.elements;
      if (bufferEntry.version !== entry.version) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, bufferEntry.buffer);
        // TODO: Allow subData, and allow usage type
        this.gl.bufferData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          entry.array,
          this.gl.STATIC_DRAW,
        );
        bufferEntry.size = entry.array.length;
        bufferEntry.version = entry.version;
      }
    }
  }

  bind(shaderBuffer: ShaderBuffer): void {
    // Using shaderBuffer's attribute information, we have to map the buffers
    // to attribute location
    const { gl } = this;
    this.buffers.forEach((value, key) => {
      const descriptor = shaderBuffer.attributes.get(key);
      if (descriptor == null) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, value.buffer);
      gl.enableVertexAttribArray(descriptor.location);
      gl.vertexAttribPointer(
        descriptor.location,
        descriptor.size,
        gl.FLOAT,
        false,
        0,
        0,
      );
    });
    if (this.elements != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elements.buffer);
    }
  }

  render(): void {
    const { gl } = this;
    if (this.elements != null) {
      gl.drawElements(
        gl.TRIANGLES,
        this.elements.size / 3 | 0,
        gl.UNSIGNED_SHORT,
        0,
      );
    }
  }
}
