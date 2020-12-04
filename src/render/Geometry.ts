import {
  GeometryAttribute,
  GeometryDescriptor,
  TRIANGLES,
} from '../types/Geometry';

import { parseAttribute, flattenBuffer } from '../utils/parseAttribute';

interface BufferEntry<T> {
  array: T,
  version: number,
}

interface AttributeEntry extends BufferEntry<Float32Array> {
  axis: number,
  stride: number,
  offset: number,
  instanced: number,
  count: number,
}

export class Geometry {
  // TODO: The buffer can be a separate object; though I'm not sure that would
  // be used inside a game engine?
  attributes: Map<string, AttributeEntry> = new Map();

  indices: BufferEntry<Uint16Array> | null = null;

  mode: number = 0;

  count: number = 0;

  inferredCount: number = 0;

  constructor(config?: GeometryDescriptor) {
    if (config != null) this.set(config);
  }

  set(config: GeometryDescriptor): void {
    const { attributes, indices, mode = TRIANGLES } = config;
    Object.keys(attributes).forEach((key) => {
      const attrib = attributes[key];
      this.setAttribute(key, parseAttribute(attrib));
    });
    if (indices == null) {
      this.setIndices(null);
    } else {
      this.setIndices(new Uint16Array(indices));
    }
    this.mode = mode;
  }

  getAttribute(name: string): AttributeEntry | null {
    const entry = this.attributes.get(name);
    if (entry == null) return null;
    return entry;
  }

  setAttribute(name: string, value: GeometryAttribute): void {
    const entry = this.attributes.get(name);
    const array = flattenBuffer(value.data);
    if (entry == null) {
      this.attributes.set(name, {
        array,
        version: 0,
        axis: value.axis,
        stride: value.stride || 0,
        offset: value.offset || 0,
        instanced: value.instanced || 0,
        count: array.length / value.axis | 0,
      });
    } else {
      entry.array = array;
      entry.version += 1;
      entry.axis = value.axis;
      entry.stride = value.stride || 0;
      entry.offset = value.offset || 0;
      entry.instanced = value.instanced || 0;
      entry.count = array.length / value.axis | 0;
    }
    if (value.instanced == null || value.instanced === 0) {
      this.inferredCount = array.length / value.axis | 0;
    }
  }

  getIndices(): Uint16Array | null {
    if (this.indices == null) return null;
    return this.indices.array;
  }

  setIndices(value: Uint16Array | null): void {
    if (value == null) {
      this.indices = null;
      return;
    }
    if (this.indices == null) {
      this.indices = { array: value, version: 0 };
    } else {
      this.indices.array = value;
      this.indices.version += 1;
    }
    this.inferredCount = value.length;
  }

  getCount(): number {
    return this.inferredCount;
  }
}
