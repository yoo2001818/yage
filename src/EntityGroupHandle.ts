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

  add<T>(component: Component<T> | string): void {
    if (typeof component === 'string') {
      const target = this.store.getComponent(component);
      this.add(target);
      return;
    }
    if (this.has(component)) return;
    // To register a component, we need to allocate fitting block from the
    // component array, and write its offset to the group.
    const offset = component.allocate(this.group.maxSize);
    this.group.offsets[component.pos] = offset;
    this.group.updateHashCode();
  }

  remove<T>(component: Component<T> | string): void {
    if (typeof component === 'string') {
      const target = this.store.getComponent(component);
      this.remove(target);
      return;
    }
    if (!this.has(component)) return;
    component.unallocate(this.group.offsets[component.pos], this.group.maxSize);
    this.group.offsets[component.pos] = -1;
    this.group.updateHashCode();
  }

  has<T>(component: Component<T> | string): boolean {
    if (typeof component === 'string') {
      const target = this.store.getComponent(component);
      return this.has(target);
    }
    const { offsets } = this.group;
    const { pos } = component;
    if (offsets.length <= pos) return false;
    // If offset is -1, it means that the component is not assigned - therefore
    // it does not belong to this entity group
    return offsets[pos] !== -1;
  }

  get<T>(component: Component<T> | string, index: number = 0): T {
    if (typeof component === 'string') {
      const target = this.store.getComponent(component);
      return this.get(target, index) as T;
    }
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.get(offset + index);
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

  copyFrom<T>(
    component: Component<T> | string,
    source: T,
    index: number = 0,
  ): void {
    if (typeof component === 'string') {
      const comp = this.store.getComponent(component);
      return this.copyFrom(comp, source, index);
    }
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.copyFrom(offset + index, source);
  }

  copyTo<T>(
    component: Component<T> | string,
    target: T,
    index: number = 0,
  ): void {
    if (typeof component === 'string') {
      const comp = this.store.getComponent(component);
      return this.copyTo(comp, target, index);
    }
    const { pos, array } = component;
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.copyTo(offset + index, target);
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
      this.copyFrom(
        component,
        source.get(component, sourceIndex),
        targetIndex,
      );
    }
  }

  serialize(index: number = 0): unknown {
    const output: Record<string, unknown> = {};
    const components = this.getComponents();
    for (let i = 0; i < components.length; i += 1) {
      const component = components[i];
      output[component.name] = this.get(component, index);
    }
    return output;
  }

  deserialize(value: unknown, index: number = 0): void {
    if (typeof value !== 'object' || value == null) return;
    const valueTable = value as Record<string, unknown>;
    // eslint-disable-next-line guard-for-in
    for (const name in value) {
      const component = this.store.getComponent(name);
      if (!this.has(component)) {
        this.add(component);
      }
      this.copyFrom(component, valueTable[name], index);
    }
  }

  get disposed(): boolean {
    return this.group.disposed;
  }
}
