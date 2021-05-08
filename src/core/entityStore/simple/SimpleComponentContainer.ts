import { ComponentContainer, Entity, EntityStore } from '../types';

export class SimpleComponentContainer<T> implements ComponentContainer<T, T> {
  id!: number;

  name!: string;

  store!: EntityStore;

  register(store: EntityStore, id: number, name: string): void {
    this.id = id;
    this.name = name;
    this.store = store;
  }

  has(entity: Entity): boolean {
    return entity.componentData[this.id] !== undefined;
  }

  get(entity: Entity): T {
    const value = entity.componentData[this.id];
    if (value === undefined) {
      throw new Error(`Entity doesn't have component ${this.name} set`);
    }
    return value as T;
  }

  set(entity: Entity, value: T): void {
    entity.componentData[this.id] = value;
  }

  delete(entity: Entity): void {
    entity.componentData[this.id] = undefined;
  }

  getSignature(entity: Entity): number {
    return this.has(entity) ? 1 : 0;
  }
}
