import { Component } from './components/Component';
import { ImmutableComponent } from './components/ImmutableComponent';
import { EntityGroup } from './EntityGroup';
import { Entity } from './Entity';
import { unallocateGroup, addGroupComponent, getGroupComponentOffset } from './EntityGroupMethods';

export class EntityStore {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  entityGroups: EntityGroup[] = [];

  deadEntityGroups: EntityGroup[] = [];

  idComponent: Component<number>;

  lastGroupId: number = 0;

  lastEntityId: number = 0;

  constructor() {
    this.idComponent = this.addComponent(
      'id',
      new ImmutableComponent<number>(() => 0),
    );
  }

  addComponent<T>(name: string, component: Component<T>): Component<T> {
    // It should register component to registry; this should do the following:
    // 1. Check if component name conflicts.
    // 2. If not, using given component array, just create and append the
    //    component to components. Easy!

    if (name in this.componentNames) {
      throw new Error(`Component ${name} is already registered`);
    }

    component.register(name, this.components.length);
    // Register component's offset to componentNames
    this.componentNames[name] = this.components.length;
    this.components.push(component);
    return component;
  }

  getComponent<T>(name: string): Component<T> {
    const pos = this.componentNames[name];
    if (pos == null) {
      throw new Error(`Component ${name} does not exist`);
    }
    return this.components[pos] as Component<T>;
  }

  createEntity(
    base?: (string | Component<unknown>)[] | object,
  ): Entity {
    const group = this._createEntityGroup();
    group.size = 1;
    group.maxSize = 1;

    // Initialize id component
    const entity = new Entity(this, group, 0);
    entity.add(this.idComponent);
    entity.set(this.idComponent, this.lastEntityId);
    this.lastEntityId += 1;

    // If base was provided as an array, initialize them
    if (Array.isArray(base)) {
      base.forEach((item) => entity.add(item));
      entity.unfloat();
    } else if (base != null) {
      Object.keys(base).forEach((key) => {
        entity.add(key);
        entity.set(key, (base as { [key: string]: unknown })[key]);
      });
      entity.unfloat();
    }

    return entity;
  }

  _removeEntityGroup(group: EntityGroup): void {
    unallocateGroup(group, this);
    // Remove itself from entity groups (TODO: don't full scan)
    this.entityGroups = this.entityGroups.filter((v) => v !== group);
    // Register this to dead list
    this.deadEntityGroups.push(group);
  }

  getEntity(id: number): Entity | null {
    // In order to retrieve an entity from ID, we must have reverse index.
    // For now, let's just full-scan the entities...

    for (let i = 0; i < this.entityGroups.length; i += 1) {
      const group = this.entityGroups[i];
      const offset = group.offsets[this.idComponent.pos!];
      if (offset === -1) continue;
      for (let j = 0; j < group.size; j += 1) {
        if (id === this.idComponent.get(offset + j)) {
          return new Entity(this, group, j);
        }
      }
    }
    return null;
  }

  forEachGroup(callback: (group: EntityGroup) => void): void {
    this.entityGroups.forEach(callback);
  }

  forEach(callback: (entity: Entity) => void): void {
    this.entityGroups.forEach((group) => {
      const { size } = group;
      for (let i = 0; i < size; i += 1) {
        callback(new Entity(this, group, i));
      }
    });
  }

  forEachWith<T extends any[]>(
    components: { [K in keyof T]: Component<T[K]> },
    callback: (e: Entity, ...args: T) => void,
  ): void {
    this.entityGroups.forEach((group) => {
      let failed = false;
      const offsets = components.map((component) => {
        const offset = getGroupComponentOffset(group, component);
        if (offset === -1) failed = true;
        return offset;
      });
      if (failed) return;
      const { size } = group;
      for (let i = 0; i < size; i += 1) {
        const entity = new Entity(this, group, i);
        callback(
          entity,
          ...components.map((v, j) => v.get(offsets[j] + i)) as T,
        );
      }
    });
  }

  serialize(): unknown[] {
    const output: unknown[] = [];
    this.forEach((entity) => {
      output.push(entity.serialize());
    });
    return output;
  }

  deserialize(input: unknown[]): void {
    input.forEach((entry) => {
      const entity = this.createEntity();
      entity.deserialize(entry);
    });
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
    group.id = this.lastGroupId;
    this.lastGroupId += 1;
    this.entityGroups.push(group);
    return group;
  }

  _createEntityGroupFrom(baseGroup: EntityGroup, size: number): EntityGroup {
    // Looking at base group's structure, it creates an entity group with
    // same structure.

    const group = this._createEntityGroup();
    group.maxSize = size;

    for (let i = 0; i < baseGroup.offsets.length; i += 1) {
      if (baseGroup.offsets[i] !== -1) {
        addGroupComponent(group, this.components[i]);
      }
    }

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
}
