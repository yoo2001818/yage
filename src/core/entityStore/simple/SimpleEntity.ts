import { Entity } from '../types';

export class SimpleEntity implements Entity {
  id: number;

  map: Map<string, unknown>;

  constructor(id: number) {
    this.id = id;
    this.map = new Map();
  }

  has(name: string): boolean {
    return this.map.has(name);
  }

  get<V>(name: string): V {
    if (!this.has(name)) {
      throw new Error(`Component ${name} does not exist`);
    }
    return this.map.get(name) as V;
  }

  set<V>(name: string, value: V): void {
    this.map.set(name, value);
  }

  delete(name: string): void {
    this.map.delete(name);
  }

  emit(name: string): void {
    // noop
  }

  toObject(): { [key: string]: unknown } {
    const output: { [key: string]: unknown } = {};
    for (const [key, value] of this.map.entries()) {
      output[key] = value;
    }
    return output;
  }

  fromObject(value: { [key: string]: unknown }): void {
    this.map.clear();
    Object.keys(value).forEach((key) => {
      this.set(key, value[key]);
    });
  }
}
