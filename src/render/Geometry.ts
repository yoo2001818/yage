interface AttributeEntry<T> {
  array: T,
  version: number,
}

export class Geometry {
  // TODO: The buffer can be a separate object; though I'm not sure that would
  // be used inside a game engine?
  attributes: Map<string, AttributeEntry<Float32Array>> = new Map();

  indices: Map<string, AttributeEntry<Uint32Array>> = new Map();

  getBuffer(name: string): Float32Array | null {
    const entry = this.attributes.get(name);
    if (entry == null) return null;
    return entry.array;
  }

  setBuffer(name: string, value: Float32Array): void {
    const entry = this.attributes.get(name);
    if (entry == null) {
      this.attributes.set(name, { array: value, version: 0 });
    } else {
      entry.array = value;
      entry.version += 1;
    }
  }
}
