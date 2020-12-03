interface GeometryAttribute {
  data: number[] | number[][] | Float32Array,
  axis: number,
  stride?: number | null,
  offset?: number | null,
}

interface GeometryDescriptor {
  attributes: { [key: string]: GeometryAttribute | number[][] },
  indices?: number[] | Uint16Array | null,
  mode?: number,
}

interface BufferEntry<T> {
  array: T,
  version: number,
}

interface AttributeEntry extends BufferEntry<Float32Array> {
  axis: number,
  stride: number,
  offset: number,
}

export function parseAttribute(
  input: GeometryAttribute | number[][],
): GeometryAttribute {
  if (Array.isArray(input)) {
    // Get vector axis size and attribute size
    const axis = input[0].length;
    const output = new Float32Array(axis * input.length);
    let ptr = 0;
    input.forEach((v) => {
      for (let i = 0; i < axis; i += 1) {
        output[ptr] = v[i];
        ptr += 1;
      }
    });
    return { axis, data: output };
  }
  return input;
}

export function flattenBuffer(
  data: number[] | number[][] | Float32Array,
): Float32Array {
  if (data instanceof Float32Array) return data;
  if (Array.isArray(data[0])) {
    const axis = data[0].length;
    const output = new Float32Array(data.length * axis);
    for (let i = 0; i < data.length; i += 1) {
      const entry = data[i] as number[];
      for (let j = 0; j < axis; j += 1) {
        output[i * axis + j] = entry[j];
      }
    }
    return output;
  }
  return new Float32Array(data as number[]);
}

export const POINTS = 0;
export const LINES = 1;
export const LINE_LOOP = 2;
export const LINE_STRIP = 3;
export const TRIANGLES = 4;
export const TRIANGLE_STRIP = 5;
export const TRIANGLE_FAN = 6;

export class Geometry {
  // TODO: The buffer can be a separate object; though I'm not sure that would
  // be used inside a game engine?
  attributes: Map<string, AttributeEntry> = new Map();

  indices: BufferEntry<Uint16Array> | null = null;

  mode: number = 0;

  count: number = 0;

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
      });
    } else {
      entry.array = array;
      entry.version += 1;
      entry.axis = value.axis;
      entry.stride = value.stride || 0;
      entry.offset = value.offset || 0;
    }
    this.count = array.length / value.axis | 0;
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
  }
}
