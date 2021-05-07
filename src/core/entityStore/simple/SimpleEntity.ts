import { SimpleEntityStore } from './SimpleEntityStore';

import { ComponentContainer, Entity } from '../types';

export class SimpleEntity implements Entity {
  id: number;

  componentData: unknown[];

  store: SimpleEntityStore;

  constructor(store: SimpleEntityStore, id: number) {
    this.id = id;
    this.componentData = [];
    this.store = store;
  }

  has(component: string | ComponentContainer<any, any>): boolean {
    if (typeof component === 'string') {
      return this.has(this.store.getComponent(component));
    }
    return component.has(this);
  }

  get<O>(component: string | ComponentContainer<any, O>): O {
    if (typeof component === 'string') {
      return this.get(this.store.getComponent(component));
    }
    return component.get(this);
  }

  set<I>(component: string | ComponentContainer<I, any>, value: I): void {
    if (typeof component === 'string') {
      return this.set(this.store.getComponent(component), value);
    }
    return component.set(this, value);
  }

  delete(component: string | ComponentContainer<any, any>): void {
    if (typeof component === 'string') {
      return this.delete(this.store.getComponent(component));
    }
    return component.delete(this);
  }

  clear(): void {
    for (const component of this.store.getComponents()) {
      component.delete(this);
    }
  }

  toObject(): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const component of this.store.getComponents()) {
      if (component.has(this)) {
        output[component.name] = component.get(this);
      }
    }
    return output;
  }

  fromObject(map: Record<string, unknown>): void {
    this.clear();
    for (const [name, value] of Object.entries(map)) {
      this.set(name, value);
    }
  }

  getSignature(): number {
    let value: number = 0;
    for (const component of this.store.getComponents()) {
      value = value * 7 + component.getSignature(this);
    }
    return value;
  }
}
