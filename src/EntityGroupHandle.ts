import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';

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

  add(name: string): void {
    // Do nothing if already registered
    if (this.has(name)) return;
    const component = this.store.getComponent(name);
    // To register a component, we need to allocate fitting block from the
    // component array, and write its offset to the group.
    const offset = component.allocate(this.group.maxSize);
    this.group.offsets[component.pos] = offset;
    this.group.updateHashCode();
  }

  remove(name: string): void {
    if (!this.has(name)) return;
    const component = this.store.getComponent(name);
    component.unallocate(this.group.offsets[component.pos], this.group.maxSize);
    this.group.offsets[component.pos] = -1;
    this.group.updateHashCode();
  }

  get(name: string, index: number = 0): unknown {
    const { pos, array } = this.store.getComponent(name);
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.get(offset + index);
  }

  has(name: string): boolean {
    const { pos } = this.store.getComponent(name);
    const { offsets } = this.group;
    if (offsets.length <= pos) return false;
    // If offset is -1, it means that the component is not assigned - therefore
    // it does not belong to this entity group
    return offsets[pos] !== -1;
  }

  getComponentNames(): string[] {
    const { offsets } = this.group;
    const output: string[] = [];
    for (let i = 0; i < offsets.length; i += 1) {
      if (offsets[i] !== -1) {
        output.push(this.store.components[i].name);
      }
    }
    return output;
  }

  copyFrom(name: string, source: unknown, index: number = 0): void {
    const { pos, array } = this.store.getComponent(name);
    const { offsets } = this.group;
    const offset = offsets[pos];
    return array.copyFrom(offset + index, source);
  }

  copyTo(name: string, target: unknown, index: number = 0): void {
    const { pos, array } = this.store.getComponent(name);
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
    const componentNames = this.getComponentNames();
    for (let i = 0; i < componentNames.length; i += 1) {
      const name = componentNames[i];
      this.copyFrom(name, source.get(name, sourceIndex), targetIndex);
    }
  }

  get disposed(): boolean {
    return this.group.disposed;
  }
}
