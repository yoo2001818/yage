import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';
import { copyGroupEntity, addGroupComponent, removeGroupComponent } from './EntityGroupMethods';

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
    // Copy oldGroup's contents onto newGroup
    copyGroupEntity(
      this.store,
      oldGroup,
      newGroup,
      this.index,
      0,
    );
    this.group = newGroup;
    this.index = 0;
  }

  unfloat(): void {
    if (this.group.maxSize !== 1) return;
    // Find a large entity group
    const oldGroup = this.group;
    const newGroup = this.store._findEntityGroup(oldGroup.hashCode)
      || this.store._createEntityGroupFrom(oldGroup, 32);
    const newIndex = newGroup.size;
    newGroup.size += 1;
    copyGroupEntity(
      this.store,
      oldGroup,
      newGroup,
      this.index,
      newIndex,
    );
    this.group = newGroup;
    this.index = newIndex;
  }

  add<T>(component: Component<T> | string): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.add(componentInst);
      return;
    }
    this.float();
    addGroupComponent(this.group, component);
  }

  remove<T>(component: Component<T> | string): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.remove(componentInst);
      return;
    }
    this.float();
    removeGroupComponent(this.group, component);
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
