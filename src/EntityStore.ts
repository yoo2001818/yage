import { ComponentArray } from './ComponentArray';
import { Component } from './Component';
import { EntityGroup } from './EntityGroup';
import { EntityGroupHandle } from './EntityGroupHandle';
import { IdComponentArray } from './IdComponentArray';

const GROUP_SIZE = 32;

export class EntityStore {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  entityGroups: EntityGroup[] = [];

  deadEntityGroups: EntityGroup[] = [];

  constructor() {
    this.addComponent('id', new IdComponentArray());
  }

  addComponent<T>(name: string, array: ComponentArray<T>): void {
    // It should register component to registry; this should do the following:
    // 1. Check if component name conflicts.
    // 2. If not, using given component array, just create and append the
    //    component to components. Easy!

    if (name in this.componentNames) {
      throw new Error(`Component ${name} is already registered`);
    }

    const component = new Component(name, this.components.length, array);
    // Register component's offset to componentNames
    this.componentNames[name] = component.pos;
    this.components.push(component);
  }

  getComponent<T>(name: string): Component<T> {
    const pos = this.componentNames[name];
    if (pos == null) {
      throw new Error(`Component ${name} does not exist`);
    }
    return this.components[pos] as Component<T>;
  }

  createEntity(): EntityGroupHandle {
    // It should create an entity group with size of 1, and wrap it using
    // EntityGroupHandle

    const group = this._createEntityGroup();
    group.size = 1;
    group.maxSize = 1;

    // Initialize id component
    const handle = new EntityGroupHandle(this, group);
    handle.add('id');

    return handle;
  }

  removeEntity(handle: EntityGroupHandle): void {
    // Unallocate resources assigned to entity group
    handle.dispose();
    // Register this to dead list
    this.deadEntityGroups.push(handle.group);
  }

  getEntity(id: number): [EntityGroupHandle, number] | null {
    // In order to retrieve an entity from ID, we must have reverse index.
    // For now, let's just full-scan the entities...

    const idComponent = this.getComponent('id');

    for (let i = 0; i < this.entityGroups.length; i += 1) {
      const group = this.entityGroups[i];
      const offset = group.offsets[idComponent.pos];
      if (offset === -1) continue;
      for (let j = 0; j < group.size; j += 1) {
        if (id === idComponent.array.get(offset + j)) {
          const handle = new EntityGroupHandle(this, group);
          return [handle, j];
        }
      }
    }
    return null;
  }

  _createEntityGroup(): EntityGroup {
    if (this.deadEntityGroups.length > 0) {
      const group = this.deadEntityGroups.pop() as EntityGroup;
      group.disposed = false;
      group.size = 0;
      this.entityGroups.push(group);
      return group;
    }
    const group = new EntityGroup();
    this.entityGroups.push(group);
    return group;
  }

  _createEntityGroupFrom(baseGroup: EntityGroup, size: number): EntityGroup {
    // Looking at base group's structure, it creates an entity group with
    // same structure.

    const group = this._createEntityGroup();
    group.maxSize = size;

    // TODO: We need utility function for this...
    const handle = new EntityGroupHandle(this, group);
    for (let i = 0; i < baseGroup.offsets.length; i += 1) {
      if (baseGroup.offsets[i] !== -1) {
        handle.add(this.components[i].name);
      }
    }

    this.entityGroups.push(group);

    return group;
  }

  _findEntityGroup(hashCode: number): EntityGroup | null {
    for (let i = 0; i < this.entityGroups.length; i += 1) {
      const group = this.entityGroups[i];
      if (
        group.size < group.maxSize
        && group.hashCode === hashCode
      ) {
        return group;
      }
    }
    return null;
  }

  // TODO: Float the entity using ID
  floatEntity(
    handle: EntityGroupHandle,
    offset: number,
  ): EntityGroupHandle {
    if (handle.group.maxSize === 1) {
      throw new Error('The provided entity group handle is already floating.');
    }
    // Floating an entity is too easy; we just copy its structure / contents
    // to size 1 entity.
    const group = this._createEntityGroupFrom(handle.group, 1);
    group.size = 1;
    const targetHandle = new EntityGroupHandle(this, group);
    // Copy entity's contents...
    targetHandle.copyEntityFrom(handle, offset, 0);
    return targetHandle;
  }

  unfloatEntity(handle: EntityGroupHandle): [EntityGroupHandle, number] {
    if (handle.group.maxSize !== 1) {
      throw new Error('The provided entity group handle is not floating.');
    }

    // To unfloat an entity, we need to find or create an entity group that
    // matches current entity's components.

    // To do that, we would need a signature (a bitset, or a string) to
    // distinguish each component pattern. This means we have to scan through
    // entity groups...
    // TODO: What if the entity group is overflown?
    const group = this._findEntityGroup(handle.group.hashCode)
      || this._createEntityGroupFrom(handle.group, GROUP_SIZE);
    const targetHandle = new EntityGroupHandle(this, group);

    const offset = targetHandle.pushEntity();
    targetHandle.copyEntityFrom(handle, 0, offset);

    // Delete previous entity as everything is copied from there
    this.removeEntity(handle);

    return [targetHandle, offset];
  }
}
