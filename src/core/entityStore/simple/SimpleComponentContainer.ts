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

  get(entity: Entity): T | undefined {
    const value = entity.componentData[this.id];
    return value as T | undefined;
  }

  set(entity: Entity, value: T): void {
    entity.componentData[this.id] = value;
  }

  delete(entity: Entity): void {
    entity.componentData[this.id] = undefined;
  }

  unfloat(): void {
    // noop
  }

  float(): void {
    // noop
  }

  initPage(): void {
    // noop
  }

  finalizePage(): void {
    // noop
  }

  getSignature(entity: Entity): number {
    return this.has(entity) ? 1 : 0;
  }
}
