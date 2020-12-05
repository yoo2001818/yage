import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from '../components/Component';
import {
  copyGroupEntity,
  addGroupComponent,
  removeGroupComponent,
  getGroupComponentOffset,
  getGroupComponents,
  copyGroupComponents,
  isAllocated,
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
    const [newGroup, newIndex] = this.store.createFloatingEntitySlot();
    // Copy oldGroup's signature onto new floating entity
    copyGroupComponents(this.store, oldGroup.offsets, newGroup);
    // Copy oldGroup's contents onto newGroup
    copyGroupEntity(
      this.store,
      oldGroup,
      newGroup,
      this.index,
      0,
    );
    this.store.releaseEntitySlot(oldGroup, this.index);
    this.group = newGroup;
    this.index = newIndex;
  }

  unfloat(): void {
    if (this.group.maxSize !== 1) return;
    const oldGroup = this.group;
    const [newGroup, newIndex] = this.store.createEntitySlot(oldGroup.offsets);
    copyGroupEntity(
      this.store,
      oldGroup,
      newGroup,
      this.index,
      newIndex,
    );
    this.store.releaseEntitySlot(oldGroup, this.index);
    this.group = newGroup;
    this.index = newIndex;
  }

  remove<T>(component: Component<T> | string): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.remove(componentInst);
      return;
    }
    removeGroupComponent(this.group, component, this.store);
    component.markChanged(this.group);
  }

  has<T>(component: Component<T> | string): boolean {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      return this.has(componentInst);
    }
    return isAllocated(getGroupComponentOffset(this.group, component));
  }

  getPos<T>(component: Component<T> | string): number {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      return this.getPos(componentInst);
    }
    return getGroupComponentOffset(this.group, component);
  }

  getId(): number {
    return this.get(this.store.idComponent);
  }

  get id(): number {
    return this.get(this.store.idComponent);
  }

  get<T>(component: Component<T> | string): T {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      return this.get(componentInst) as T;
    }
    const offset = getGroupComponentOffset(this.group, component);
    if (!isAllocated(offset)) {
      throw new Error(`Component ${component.name} does not exist in entity`);
    }
    return component.get(offset + this.index);
  }

  destroy(): void {
    this.store.releaseEntitySlot(this.group, this.index);
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
    if (component.isUnison()) {
      // TODO Warn the user if source is same to destination
      const offset = getGroupComponentOffset(this.group, component);
      const targetOffset = component.probeOffset(source);
      if (targetOffset !== offset) {
        this.float();
        addGroupComponent(this.group, component, source, this.store);
      }
    } else {
      let offset = getGroupComponentOffset(this.group, component);
      if (!isAllocated(offset)) {
        this.float();
        offset = addGroupComponent(this.group, component, source, this.store);
      }
      component.set(offset + this.index, source);
      component.markChanged(this.group, this.index, 1);
    }
  }

  markChanged<T>(
    component: Component<T> | string,
  ): void {
    if (typeof component === 'string') {
      const componentInst = this.store.getComponent(component);
      this.markChanged(componentInst);
      return;
    }
    component.markChanged(this.group, this.index, 1);
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
    if (!isAllocated(offset)) return;
    component.copyTo(offset + this.index, target);
  }

  serialize(): unknown {
    const output: Record<string, unknown> = {};
    const components = this.getComponents();
    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      output[component.name!] = this.get(component);
    }
    return output;
  }

  deserialize(value: unknown): void {
    if (typeof value !== 'object' || value == null) return;
    const valueTable = value as Record<string, unknown>;
    // eslint-disable-next-line guard-for-in
    for (const name in value) {
      const component = this.store.getComponent(name);
      this.set(component, valueTable[name]);
    }
  }
}
