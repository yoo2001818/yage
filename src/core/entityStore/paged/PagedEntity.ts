import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntityPage } from './PagedEntityPage';

import { Entity } from '../types';

export class PagedEntity implements Entity {
  id: number;

  map: Map<string, unknown>;

  store: PagedEntityStore;

  constructor(store: PagedEntityStore, id: number) {
    this.id = id;
    this.map = new Map();
    this.store = store;
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
    new PagedEntityPage(this.store, [this]).emit(name);
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
