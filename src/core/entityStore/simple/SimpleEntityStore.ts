import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityQuery } from './SimpleEntityQuery';
import { SimpleEntityPage } from './SimpleEntityPage';
import { Signal } from '../../Signal';

import { ComponentContainer, EntityStore } from '../types';

export class SimpleEntityStore implements EntityStore {
  entities: (SimpleEntity | null)[];

  deletedIds: number[];

  signals: Map<string, Signal<[SimpleEntityPage]>>;

  components: ComponentContainer<any, any>[];

  componentsMap: Map<string, ComponentContainer<any, any>>;

  constructor() {
    this.entities = [];
    this.deletedIds = [];
    this.signals = new Map();
    this.components = [];
    this.componentsMap = new Map();
  }

  get(id: number): SimpleEntity | null {
    return this.entities[id];
  }

  create(map?: Record<string, unknown>): SimpleEntity {
    const newId = this.deletedIds.pop();
    if (newId != null) {
      const entity = new SimpleEntity(this, newId);
      this.entities[newId] = entity;
      return entity;
    }
    const entity = new SimpleEntity(this, this.entities.length);
    this.entities.push(entity);
    if (map != null) {
      entity.fromObject(map);
    }
    return entity;
  }

  delete(id: number): void {
    if (this.entities[id] == null) return;
    this.entities[id] = null;
    this.deletedIds.push(id);
  }

  forEach(callback: (entity: SimpleEntity) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(entity);
    });
  }

  forEachPage(callback: (page: SimpleEntityPage) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(new SimpleEntityPage(this, [entity]));
    });
  }

  query(): SimpleEntityQuery {
    return new SimpleEntityQuery(this);
  }

  getSignal(name: string): Signal<[SimpleEntityPage]> {
    let signal = this.signals.get(name);
    if (signal == null) {
      signal = new Signal<[SimpleEntityPage]>();
      this.signals.set(name, signal);
    }
    return signal;
  }

  addComponent(
    name: string,
    componentContainer: ComponentContainer<any, any>,
  ): void {
    if (this.componentsMap.has(name)) {
      throw new Error(`Already registered component ${name}`);
    }
    const id = this.components.length;
    componentContainer.register(this, id, name);
    this.components.push(componentContainer);
    this.componentsMap.set(name, componentContainer);
  }

  addComponents(
    components: Record<string, ComponentContainer<any, any>>,
  ): void {
    for (const [name, value] of Object.entries(components)) {
      this.addComponent(name, value);
    }
  }

  getComponent<T extends ComponentContainer<any, any>>(name: string): T {
    const component = this.componentsMap.get(name);
    if (component == null) {
      throw new Error(`Unknown component ${name}`);
    }
    return component as T;
  }

  getComponents(): ComponentContainer<any, any>[] {
    return this.components;
  }
}
