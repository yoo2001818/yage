import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntityPage } from './PagedEntityPage';

import { ComponentContainer, Entity } from '../types';

export class PagedEntity implements Entity {
  id: number;

  parent: PagedEntityPage | null;

  offset: number;

  componentData: unknown[];

  store: PagedEntityStore;

  constructor(
    store: PagedEntityStore,
    id: number,
    parent: PagedEntityPage | null,
    offset: number,
  ) {
    this.id = id;
    this.parent = parent;
    this.offset = offset;
    this.componentData = [];
    this.store = store;
  }

  has(component: string | ComponentContainer<any, any>): boolean {
    if (typeof component === 'string') {
      return this.has(this.store.getComponent(component));
    }
    return component.has(this);
  }

  get<O>(component: string | ComponentContainer<any, O>): O | undefined {
    if (typeof component === 'string') {
      return this.get(this.store.getComponent(component));
    }
    return component.get(this);
  }

  set<I>(component: string | ComponentContainer<I, any>, value: I): void {
    if (typeof component === 'string') {
      return this.set(this.store.getComponent(component), value);
    }
    // TODO Should the component signature changes, make it floating
    return component.set(this, value);
  }

  delete(component: string | ComponentContainer<any, any>): void {
    if (typeof component === 'string') {
      return this.delete(this.store.getComponent(component));
    }
    // TODO Should the component signature changes, make it floating
    // Because floating operation is relatively simple,
    return component.delete(this);
  }

  clear(): void {
    for (const component of this.store.getComponents()) {
      component.delete(this);
    }
    // TODO Should the component signature changes, make it floating
  }

  float(): void {
    // Make the parent locked.
  }

  unfloat(): void {
    // Find the appropriate EntityClass using the signature, and move to there.
  }

  move(destPage: PagedEntityPage | null, destOffset: number): void {
    // Dial all components to move the data, then set its own page / offset.
    for (const component of this.store.getComponents()) {
      component.move(this, destPage, destOffset);
    }
    if (this.parent != null) {
      this.parent.releaseSlot(this.offset);
    }
    this.parent = destPage;
    this.offset = destOffset;
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

  getSignatures(): number[] {
    return this.store.getComponents()
      .map((component) => component.getSignature(this));
  }

  getSignature(): number {
    let value: number = 0;
    for (const component of this.store.getComponents()) {
      value = value * 7 + component.getSignature(this);
    }
    return value;
  }
}
