import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';

export class Entity {
  store: EntityStore;

  group: EntityGroup;

  index: number;

  constructor(store: EntityStore, group: EntityGroup, index: number) {
    this.store = store;
    this.group = group;
    this.index = index;
  }

  // We have to maintain underlying structure from here.
  float(): void {
    if (this.group.maxSize === 1) return;
    const oldGroup = this.group;
    // Create a single-sized entity group
    const newGroup = this.store._createEntityGroupFrom(oldGroup, 1);
    // TODO Copy oldGroup's contents onto newGroup
    this.group = newGroup;
    this.index = 0;
  }

  unfloat(): void {
    if (this.group.maxSize !== 1) return;
    // Find a large entity group
    const oldGroup = this.group;
    const newGroup = this.store._findEntityGroup(oldGroup.hashCode)
      || this.store._createEntityGroupFrom(oldGroup, 32);
    // TODO Add new entity onto the group
    this.group = newGroup;
    this.index = 0;
  }

  add<T>(component: Component<T> | string): void {
    this.float();
  }

  remove<T>(component: Component<T> | string): void {
    this.float();
  }

  has<T>(component: Component<T> | string): boolean {

  }

  get<T>(component: Component<T> | string): T {

  }

  destroy(): void {

  }

  getComponents(): Component<unknown>[] {
  }
  
  set<T>(
    component: Component<T> | string,
    source: T,
  ): void {

  }

  copyTo<T>(
    component: Component<T> | string,
    target: T,
  ): void {

  }

  serialize(): unknown {
  }

  deserialize(value: unknown): void {
  }
}
