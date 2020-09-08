import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';
import {
  copyGroupEntity,
  addGroupComponent,
  removeGroupComponent,
  getGroupComponentOffset,
  getGroupComponents,
} from './EntityGroupMethods';

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
    if (this.index === -1) return;
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
    this.store._removeEntityGroup(oldGroup);
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
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      return this.has(componentInst);
    }
    return getGroupComponentOffset(this.group, component) !== -1;
  }

  get<T>(component: Component<T> | string): T | null {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      return this.get(componentInst) as T | null;
    }
    const offset = getGroupComponentOffset(this.group, component);
    if (offset === -1) return null;
    return component.array.get(offset + this.index);
  }

  destroy(): void {
    this.float();
    this.store._removeEntityGroup(this.group);
    this.index = -1;
  }

  getComponents(): Component<unknown>[] {
    return getGroupComponents(this.group, this.store);
  }

  set<T>(
    component: Component<T> | string,
    source: T,
  ): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.set(componentInst, source);
      return;
    }
    let offset = getGroupComponentOffset(this.group, component);
    if (offset === -1) {
      this.add(component);
      offset = getGroupComponentOffset(this.group, component);
    }
    component.array.copyFrom(offset + this.index, source);
  }

  copyTo<T>(
    component: Component<T> | string,
    target: T,
  ): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.copyTo(componentInst, target);
      return;
    }
    const offset = getGroupComponentOffset(this.group, component);
    if (offset === -1) return;
    component.array.copyTo(offset + this.index, target);
  }

  serialize(): unknown {
    const output: Record<string, unknown> = {};
    const components = this.getComponents();
    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      output[component.name] = this.get(component);
    }
    return output;
  }

  deserialize(value: unknown): void {
    if (typeof value !== 'object' || value == null) return;
    const valueTable = value as Record<string, unknown>;
    // eslint-disable-next-line guard-for-in
    for (const name in value) {
      const component = this.store.getComponent(name);
      if (!this.has(component)) {
        this.add(component);
      }
      this.set(component, valueTable[name]);
    }
  }
}
