import { Entity } from './EntityInterface';
import { Component } from '../../components/Component';

import { ValueIsComponent } from '../types';

export class StandaloneEntity<D extends ValueIsComponent<D> = any>
implements Entity<D> {
  id: number;

  map: Map<string, unknown>;

  constructor(id: number) {
    this.id = id;
    this.map = new Map();
  }

  remove<T>(component: Component<T> | string): void {
    if (typeof component === 'object') {
      if (component.name == null) throw new Error('Component needs a name');
      this.remove(component.name);
    } else {
      this.map.delete(component);
    }
  }

  has<T>(component: Component<T> | string): boolean {
    if (typeof component === 'object') {
      if (component.name == null) throw new Error('Component needs a name');
      return this.has(component.name);
    }
    return this.map.has(component);
  }

  get<T>(component: Component<T> | string): T {
    if (typeof component === 'object') {
      if (component.name == null) throw new Error('Component needs a name');
      return this.get(component.name);
    }
    return this.map.get(component) as T;
  }

  set<T>(component: Component<T> | string, source: T): void {
    if (typeof component === 'object') {
      if (component.name == null) throw new Error('Component needs a name');
      this.set(component.name, source);
    } else {
      this.map.set(component, source);
    }
  }

  markChanged(): void {
    // noop, as the standalone entity doesn't have any signals attached
  }

  toJSON(): unknown {
    const output: { [key: string]: unknown } = {};
    for (const [key, value] of this.map.entries()) {
      output[key] = value;
    }
    return output;
  }

  fromJSON(value: unknown): void {
    if (typeof value !== 'object') {
      throw new Error('Invalid object provided');
    }
    const valueObj = value as { [key: string]: unknown };
    this.map.clear();
    Object.keys(valueObj).forEach((key) => {
      this.set(key, valueObj[key]);
    });
  }
}
