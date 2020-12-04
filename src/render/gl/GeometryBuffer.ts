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
  instanced: number,
  count: number,
}

export class GeometryBuffer {
  gl: WebGLRenderingContext;

  instancedExt: ANGLE_instanced_arrays;

  buffers: Map<string, AttributeBufferEntry> = new Map();

  elements: BufferEntry | null = null;

  count: number = 0;

  mode: number = 0;

  constructor(
    gl: WebGLRenderingContext,
    instancedExt: ANGLE_instanced_arrays,
  ) {
    this.gl = gl;
    this.instancedExt = instancedExt;
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
          instanced: entry.instanced,
          count: entry.count,
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
        bufferEntry.instanced = entry.instanced;
        bufferEntry.count = entry.count;
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
    this.count = geometry.getCount();
    this.mode = geometry.mode;
  }

  bind(shaderBuffer: ShaderBuffer, primCount: number = 0): number {
    // Using shaderBuffer's attribute information, we have to map the buffers
    // to attribute location
    const { gl, instancedExt } = this;
    let maxCount = primCount;
    this.buffers.forEach((value, key) => {
      const descriptor = shaderBuffer.attributes.get(key);
      if (descriptor == null) return;
      switch (descriptor.type) {
        // TODO Support other than this
        case gl.FLOAT_MAT4: {
          gl.bindBuffer(gl.ARRAY_BUFFER, value.buffer);
          for (let i = 0; i < 4; i += 1) {
            gl.enableVertexAttribArray(descriptor.location + i);
            gl.vertexAttribPointer(
              descriptor.location + i,
              4,
              gl.FLOAT,
              false,
              (value.stride || 64),
              (value.offset || 0) + i * 16,
            );
            if (value.instanced > 0 || primCount > 0) {
              const divisor = (value.instanced || 1) * primCount;
              instancedExt
                .vertexAttribDivisorANGLE(descriptor.location + i, divisor);
              maxCount = Math.max(maxCount, value.count * divisor);
            }
          }
          break;
        }
        default:
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
          if (value.instanced > 0 || primCount > 0) {
            const divisor = (value.instanced || 1) * primCount;
            instancedExt.vertexAttribDivisorANGLE(descriptor.location, divisor);
            maxCount = Math.max(maxCount, value.count * divisor);
          }
          break;
      }
    });
    if (this.elements != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elements.buffer);
    }
    return maxCount;
  }

  render(primCount: number = 0): void {
    const { gl, instancedExt } = this;
    if (primCount === 0) {
      if (this.elements != null) {
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
    } else if (this.elements != null) {
      instancedExt.drawElementsInstancedANGLE(
        this.mode,
        this.count,
        gl.UNSIGNED_SHORT,
        0,
        primCount,
      );
    } else {
      instancedExt.drawArraysInstancedANGLE(
        this.mode,
        0,
        this.count,
        primCount,
      );
    }
  }
}
