import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';

export class EntityGroupHandle {
  store: EntityStore;

  group: EntityGroup;

  constructor(store: EntityStore, group: EntityGroup) {
    this.store = store;
    this.group = group;
  }

  get size(): number {
    return this.group.size;
  }

  dispose(): void {
    if (this.group.disposed) return;
    // Free all components belong in this entity group
    const { offsets, maxSize } = this.group;
    for (let i = 0; i < offsets.length; i += 1) {
      if (offsets[i] !== -1) {
        this.store.components[i].unallocate(offsets[i], maxSize);
        offsets[i] = -1;
      }
    }
    this.group.disposed = true;
  }

  addComponent<T>(component: Component<T>): void {
    if (this.hasComponent(component)) return;
    // To register a component, we need to allocate fitting block from the
    // component array, and write its offset to the group.
    const offset = component.allocate(this.group.maxSize);
    this.group.offsets[component.pos] = offset;
    this.group.updateHashCode();
  }

  removeComponent<T>(component: Component<T>): void {
    if (!this.hasComponent(component)) return;
    component.unallocate(this.group.offsets[component.pos], this.group.maxSize);
    this.group.offsets[component.pos] = -1;
    this.group.updateHashCode();
  }

  hasComponent<T>(component: Component<T>): boolean {
    const { offsets } = this.group;
    const { pos } = component;
    if (offsets.length <= pos) return false;
    // If offset is -1, it means that the component is not assigned - therefore
    // it does not belong to this entity group
    return offsets[pos] !== -1;
  }

  getComponent<T>(component: Component<T>, index: number = 0): T {
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.get(offset + index);
  }

  add(name: string): void {
    const component = this.store.getComponent(name);
    return this.addComponent(component);
  }

  remove(name: string): void {
    const component = this.store.getComponent(name);
    return this.removeComponent(component);
  }

  get(name: string, index: number = 0): unknown {
    const component = this.store.getComponent(name);
    return this.getComponent(component, index);
  }

  has(name: string): boolean {
    const component = this.store.getComponent(name);
    return this.hasComponent(component);
  }

  forEach(callback: (index: number) => void): void {
    for (let i = 0; i < this.size; i += 1) {
      callback(i);
    }
  }

  getComponents(): Component<unknown>[] {
    const { offsets } = this.group;
    const output: Component<unknown>[] = [];
    for (let i = 0; i < offsets.length; i += 1) {
      if (offsets[i] !== -1) {
        output.push(this.store.components[i]);
      }
    }
    return output;
  }

  getComponentNames(): string[] {
    return this.getComponents().map((v) => v.name);
  }

  copyFromComponent<T>(
    component: Component<T>,
    source: T,
    index: number = 0,
  ): void {
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.copyFrom(offset + index, source);
  }

  copyToComponent<T>(
    component: Component<T>,
    target: T,
    index: number = 0,
  ): void {
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.copyTo(offset + index, target);
  }

  copyFrom(name: string, source: unknown, index: number = 0): void {
    const component = this.store.getComponent(name);
    return this.copyFromComponent(component, source, index);
  }

  copyTo(name: string, target: unknown, index: number = 0): void {
    const component = this.store.getComponent(name);
    return this.copyToComponent(component, target, index);
  }

  pushEntity(): number {
    if (this.group.size >= this.group.maxSize) {
      throw new Error('The entity group is full');
    }
    const offset = this.group.size;
    this.group.size += 1;
    return offset;
  }

  copyEntityFrom(
    source: EntityGroupHandle,
    sourceIndex: number,
    targetIndex: number,
  ): void {
    const components = this.getComponents();
    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      this.copyFromComponent(
        component,
        source.getComponent(component, sourceIndex),
        targetIndex,
      );
    }
  }

  serialize(index: number = 0): unknown {
    const output: Record<string, unknown> = {};
    const components = this.getComponents();
    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      output[component.name] = this.getComponent(component, index);
    }
    return output;
  }

  deserialize(value: unknown, index: number = 0): void {
    if (typeof value !== 'object' || value == null) return;
    const valueTable = value as Record<string, unknown>;
    // eslint-disable-next-line guard-for-in
    for (const name in value) {
      const component = this.store.getComponent(name);
      this.copyFromComponent(component, valueTable[name], index);
    }
  }

  get disposed(): boolean {
    return this.group.disposed;
  }
}
