import { Geometry } from '../Geometry';
import { ShaderBuffer } from './ShaderBuffer';

interface BufferEntry {
  buffer: WebGLBuffer | null,
  version: number,
}

interface AttributeBufferEntry extends BufferEntry {
  axis: number,
  stride: number,
  offset: number,
}

export class GeometryBuffer {
  gl: WebGLRenderingContext;

  buffers: Map<string, AttributeBufferEntry> = new Map();

  elements: BufferEntry | null = null;

  count: number = 0;

  mode: number = 0;

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
          axis: entry.axis,
          stride: entry.stride,
          offset: entry.offset,
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
        bufferEntry.version = entry.version;
        bufferEntry.axis = entry.axis;
        bufferEntry.stride = entry.stride;
        bufferEntry.offset = entry.offset;
      }
    });
    // Then the elements
    if (geometry.indices != null) {
      const entry = geometry.indices;
      if (this.elements == null) {
        this.elements = {
          buffer: this.gl.createBuffer(),
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
        bufferEntry.version = entry.version;
      }
    }
    this.count = geometry.count;
    this.mode = geometry.mode;
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
        value.axis,
        gl.FLOAT,
        false,
        value.stride,
        value.offset,
      );
    });
    if (this.elements != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elements.buffer);
    }
  }

  render(): void {
    const { gl } = this;
    if (this.elements != null) {
      // TODO: This should be controllable by the geometry
      gl.drawElements(
        this.mode,
        this.count,
        gl.UNSIGNED_SHORT,
        0,
      );
    } else {
      gl.drawArrays(
        this.mode,
        0,
        this.count,
      );
    }
  }
}
