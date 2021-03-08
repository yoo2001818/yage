import { Component } from '../components/Component';
import { ImmutableComponent } from '../components/ImmutableComponent';
import { EntityPage } from './EntityPage';
import { EntityClass } from './EntityClass';
import { Entity, GroupEntity } from './entity';
import { Signal } from '../Signal';
import {
  getGroupContainerHashCode,
  removeGroupEntity,
  getGroupComponentOffset,
  isAllocated,
} from './EntityGroupMethods';
import { Index } from '../indexes/types';
import { IdIndex } from '../indexes/IdIndex';
import { EntityData, ValueIsComponent } from './types';

export class EntityStore<D extends ValueIsComponent<D> = any> {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  indexes: Record<string, Index> = {};

  entityGroups: EntityPage[] = [];

  // Floating entity groups are stored separately. This is because
  // entity group containers are iterated while looping through entities, but
  // floating entity groups will be missed if we just scan group containers.
  // Therefore, after iterating entity group containers, we iterate
  // floating entity groups separately.
  floatingEntityGroups: EntityPage[] = [];

  entityGroupContainers: EntityClass[] = [];

  deadEntityGroups: EntityPage[] = [];

  idComponent: Component<number>;

  removedSignal: Signal<[Entity<D>]>;

  lastGroupId: number = 0;

  lastEntityId: number = 0;

  constructor() {
    this.removedSignal = new Signal();
    this.idComponent = this.addComponent(
      'id',
      new ImmutableComponent<number>(),
    );
    this.addComponent('name', new ImmutableComponent<string>());
    this.addIndex('id', new IdIndex());
  }

  addComponent<K extends keyof D>(name: K, component: D[K]): D[K];
  addComponent<T extends Component<any>>(name: string, component: T): T;
  addComponent<T extends Component<any>>(name: string, component: T): T {
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

  addComponents<T extends Partial<D>>(components: T): void;
  addComponents<T extends { [key: string]: Component<any> }>(
    components: T,
  ): void;
  addComponents<T extends { [key: string]: Component<any> }>(
    components: T,
  ): void {
    Object.keys(components).forEach((key) => {
      const component = components[key];
      this.addComponent(key, component);
    });
  }

  getComponent<K extends keyof D>(name: K, component: D[K]): D[K];
  getComponent<T extends Component<unknown>>(name: string): T;
  getComponent<T extends Component<unknown>>(name: string): T {
    const pos = this.componentNames[name];
    if (pos == null) {
      throw new Error(`Component ${name} does not exist`);
    }
    return this.components[pos] as T;
  }

  addIndex<T extends Index>(name: string, index: T): T {
    if (name in this.indexes) {
      throw new Error(`Index ${name} is already registered`);
    }

    index.register(this);
    this.indexes[name] = index;
    return index;
  }

  getIndex<T extends Index>(name: string): T {
    const item = this.indexes[name];
    if (item == null) {
      throw new Error(`Index ${name} does not exist`);
    }
    return item as T;
  }

  createEntityGroup(): EntityPage {
    if (this.deadEntityGroups.length > 0) {
      // Scan dead entity group
      return this.deadEntityGroups.pop() as EntityPage;
    }
    const group = new EntityPage();
    group.id = this.entityGroups.length;
    this.entityGroups.push(group);
    return group;
  }

  releaseEntityGroup(group: EntityPage): void {
    // TODO Check dead entity group, push to list or remove it
    this.deadEntityGroups.push(group);
  }

  createEntityGroupContainer(): EntityClass {
    const container = new EntityClass();
    container.id = this.entityGroupContainers.length;
    this.entityGroupContainers.push(container);
    return container;
  }

  /*
  releaseEntityGroupContainer(container: EntityGroupContainer): void {
    // TODO Check dead entity group containers, push to list or remove it
    // Although this will be never called...
  }
  */

  createEntitySlot(signature: number[]): [EntityPage, number] {
    // Well, this does not make any sense because to assign an entity slot, we
    // must know the signature of the entity beforehand.
    // Still, let's support it anyway.
    const groupContainer = this.getEntityGroupContainer(signature);
    return groupContainer.createEntitySlot(this);
  }

  releaseEntitySlot(group: EntityPage, index: number): void {
    // Read group's parent ID, and process accordingly
    const { parentId } = group;
    if (parentId === -1) {
      this.releaseFloatingEntitySlot(group, index);
    } else {
      const groupContainer = this.getEntityGroupContainerById(parentId);
      // Do nothing if we can't find the group container
      if (groupContainer == null) return;
      groupContainer.releaseEntitySlot(this, group, index);
    }
  }

  createFloatingEntitySlot(): [EntityPage, number] {
    // Just create an empty entity group, assign empty entity.
    const group = this.createEntityGroup();
    // Then, we register floating entity groups inside the list. This is used
    // to reference groups later.
    group.maxSize = 1;
    group.size = 1;
    group.parentId = -1;
    group.parentIndex = this.floatingEntityGroups.length;
    this.floatingEntityGroups.push(group);
    return [group, 0];
  }

  releaseFloatingEntitySlot(group: EntityPage, index: number): void {
    // Floating entity group has only one entity within, therefore the group
    // can be released without any problem.
    removeGroupEntity(this, group, index);
    if (group.size <= 0) {
      // Remove the entity group from the list.
      // TODO: Erm, managing this would be an issue - index of this frequently
      // changes. Assuming freeGroups won't contain data too much, we'll just
      // iterate them...
      this.floatingEntityGroups = this.floatingEntityGroups
        .filter((v) => v !== group);
      // removeItem(this.floatingEntityGroups, group.parentIndex);
      // Release the entity group.
      this.releaseEntityGroup(group);
    }
  }

  createEntity(
    base?: (string | Component<unknown>)[] | EntityData<D>,
  ): Entity<D> {
    // If base was provided as an array, initialize them
    if (Array.isArray(base)) {
      // Map the component array to 'signatures'. We must make sure that
      // we don't have any 'holes' ... but I think this will be enough for now.
      // TODO Properly generate signature array
      // TODO This is no longer possible if unison component is present
      const signature: number[] = [];
      base.forEach((item) => {
        const component = typeof item === 'string'
          ? this.getComponent(item)
          : item;
        signature[component.pos!] = 0;
      });
      signature[this.idComponent.pos!] = 0;
      const [group, index] = this.createEntitySlot(signature);
      const entity = new GroupEntity(this, group, index);
      entity.set(this.idComponent, this.lastEntityId);
      this.lastEntityId += 1;
      return entity;
    }
    if (base != null) {
      // Map the component array to 'signatures'. We must make sure that
      // we don't have any 'holes' ... but I think this will be enough for now.
      // TODO Properly generate signature array
      const signature: number[] = [];
      const baseObj = base as { [key: string]: unknown };
      Object.keys(base).forEach((key) => {
        const component = this.getComponent(key);
        signature[component.pos!] = component.probeOffset(baseObj[key]);
      });
      signature[this.idComponent.pos!] = 1;
      const [group, index] = this.createEntitySlot(signature);
      const entity = new GroupEntity(this, group, index);
      entity.set(this.idComponent, this.lastEntityId);
      this.lastEntityId += 1;
      Object.keys(base).forEach((key) => {
        entity.set(key, baseObj[key]);
      });
      return entity;
    }
    // Create floating entity group. Any other logic directly goes to Entity
    const [group, index] = this.createFloatingEntitySlot();
    const entity = new GroupEntity(this, group, index);
    entity.set(this.idComponent, this.lastEntityId);
    this.lastEntityId += 1;
    return entity;
  }

  // Signature is determined by the "offsets" array of each component group.
  // -1 means the component is not used, any other value means the component
  // is used.
  // We need to convert this 'offsets' array to list of numbers - persumably a
  // bitset - but we'll do this right here for now, and accept
  // offsets array as an argument.
  getEntityGroupContainer(signature: number[]): EntityClass {
    const hashCode = getGroupContainerHashCode(signature, this);
    // Bleh - we're full scanning the array! It's okay for now...
    let item = this.entityGroupContainers
      .find((v) => v.hashCode === hashCode);
    if (item == null) {
      item = this.createEntityGroupContainer();
      item.offsets = signature;
      item.hashCode = hashCode;
    }
    return item;
  }

  getEntityGroupContainerById(id: number): EntityClass | null {
    return this.entityGroupContainers[id];
  }

  getEntity(id: number): Entity<D> | null {
    return this.getIndex<IdIndex>('id').get(id);
  }

  getEntityOfGroup(group: EntityPage, index: number): Entity<D> {
    return new GroupEntity(this, group, index);
  }

  getComponentOfEntity<T>(id: number, component: Component<T> | string): T {
    const entity = this.getEntity(id);
    if (entity == null) throw new Error(`Enttiy ${id} is missing`);
    return entity.get(component);
  }

  forEachGroup(callback: (group: EntityPage) => void): void {
    this.entityGroupContainers.forEach((container) => {
      container.groups.forEach(callback);
    });
    this.floatingEntityGroups.forEach(callback);
  }

  forEachGroupWith(
    components: Component<unknown>[],
    callback: (group: EntityPage, ...args: number[]) => void,
  ): void {
    this.entityGroupContainers.forEach((container) => {
      const passed = components.every((component) => {
        const { pos } = component;
        if (pos == null) return false;
        return container.offsets.length > pos
          && isAllocated(container.offsets[pos]);
      });
      if (!passed) return;
      container.groups.forEach((group) => {
        const offsets = components
          .map((v) => getGroupComponentOffset(group, v));
        callback(group, ...offsets);
      });
    });
    this.floatingEntityGroups.forEach((group) => {
      let passed = true;
      const offsets = components.map((component) => {
        const offset = getGroupComponentOffset(group, component);
        if (!isAllocated(offset)) passed = false;
        return offset;
      });
      if (!passed) return;
      callback(group, ...offsets);
    });
  }

  forEach(callback: (entity: Entity<D>) => void): void {
    this.forEachGroup((group) => {
      const { size } = group;
      for (let i = 0; i < size; i += 1) {
        callback(new GroupEntity(this, group, i));
      }
    });
  }

  forEachWith<T extends any[]>(
    components: { [K in keyof T]: Component<T[K]> },
    callback: (e: Entity<D>, ...args: T) => void,
  ): void {
    this.forEachGroupWith(components, (group) => {
      const offsets = components.map((v) => getGroupComponentOffset(group, v));
      const { size } = group;
      for (let i = 0; i < size; i += 1) {
        const entity = new GroupEntity(this, group, i);
        callback(
          entity,
          ...components.map((v, j) => v.get(offsets[j] + i)) as T,
        );
      }
    });
  }

  toJSON(
    mapId?: (id: number | null) => unknown,
  ): unknown[] {
    const output: unknown[] = [];
    this.forEach((entity) => {
      output.push(entity.toJSON(mapId));
    });
    return output;
  }

  fromJSON(
    input: unknown[],
    mapId?: (id: unknown) => number | null,
  ): void {
    input.forEach((entry) => {
      const entity = this.createEntity() as GroupEntity<D>;
      entity.fromJSON(entry, mapId);
      entity.unfloat();
    });
  }
}
