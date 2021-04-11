import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityClass } from './PagedEntityClass';
import { Signal } from '../../Signal';

import { EntityStore } from '../types';
import { Component } from '../../components';
import { getGroupContainerHashCode } from './utils';

export class PagedEntityStore implements EntityStore {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  classes: PagedEntityClass[];

  signals: Map<string, Signal<[PagedEntityPage]>>;

  constructor() {
    this.classes = [];
    this.signals = new Map();
  }

  addComponent<T extends Component<any>>(name: string, component: T): T {
    // It should register component to registry; this should do the following:
    // 1. Check if component name conflicts.
    // 2. If not, using given component array, just create and append the
    //    component to components. Easy!

    if (name in this.componentNames) {
      throw new Error(`Component ${name} is already registered`);
    }

    component.register(name, this.components.length);
    // Register component's offset to componentNames
    this.componentNames[name] = this.components.length;
    this.components.push(component);
    return component;
  }

  addComponents<T extends { [key: string]: Component<any> }>(
    components: T,
  ): void {
    Object.keys(components).forEach((key) => {
      const component = components[key];
      this.addComponent(key, component);
    });
  }

  getComponent<T extends Component<unknown>>(name: string): T {
    const pos = this.componentNames[name];
    if (pos == null) {
      throw new Error(`Component ${name} does not exist`);
    }
    return this.components[pos] as T;
  }

  getClass(signature: number[]): PagedEntityClass {
    const hashCode = getGroupContainerHashCode(signature, this);
    // Bleh - we're full scanning the array! It's okay for now...
    let item = this.classes
      .find((v) => v.hashCode === hashCode);
    if (item == null) {
      item = new PagedEntityClass(this, signature);
      this.classes.push(item);
    }
    return item;
  }

  get(id: number): PagedEntity | null {
  }

  create(): PagedEntity {
  }

  createFrom(object: { [key: string]: unknown }): PagedEntity {
    const entity = this.create();
    entity.fromObject(object);
    return entity;
  }

  delete(id: number): void {
  }

  forEach(callback: (entity: PagedEntity) => void): void {
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
  }

  query(): PagedEntityQuery {
    return new PagedEntityQuery(this);
  }

  getSignal(name: string): Signal<[PagedEntityPage]> {
    let signal = this.signals.get(name);
    if (signal == null) {
      signal = new Signal<[PagedEntityPage]>();
      this.signals.set(name, signal);
    }
    return signal;
  }
}
