interface AttributeEntry<T> {
  array: T,
  version: number,
}

export class Geometry {
  // TODO: The buffer can be a separate object; though I'm not sure that would
  // be used inside a game engine?
  attributes: Map<string, AttributeEntry<Float32Array>> = new Map();

  elements: AttributeEntry<Uint32Array> | null = null;

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

  getElementsBuffer(): Uint32Array | null {
    if (this.elements == null) return null;
    return this.elements.array;
  }

  setElementsBuffer(value: Uint32Array): void {
    if (this.elements == null) {
      this.elements = { array: value, version: 0 };
    } else {
      this.elements.array = value;
      this.elements.version += 1;
    }
  }
}
