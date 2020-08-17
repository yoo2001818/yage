import { ComponentArray } from './ComponentArray';
import { EntityGroup } from './EntityGroup';
import { EntityGroupHandle } from './EntityGroupHandle';
import { IdComponentArray } from './IdComponentArray';

interface Component<T> {
  name: string,
  pos: number,
  array: ComponentArray<T>,
  deadBlocks: number[],
}

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

    // TODO: Make this as a class
    const component: Component<T> = {
      name,
      pos: this.components.length,
      array,
      deadBlocks: [],
    };
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

    // TODO: If deadEntityGroups exist, pull one from there

    const group = new EntityGroup();
    group.size = 1;
    group.maxSize = 1;

    // Initialize id component
    const handle = new EntityGroupHandle(this, group);
    handle.add('id');

    return handle;
  }

  removeEntity(handle: EntityGroupHandle): void {
    throw new Error('Not implemented');
  }

  getEntity(id: number): [EntityGroupHandle, number] {
    throw new Error('Not implemented');
  }

  _createEntityGroup(baseGroup: EntityGroup): EntityGroup {
    // Looking at base group's structure, it creates an entity group with
    // same structure.

    const group = new EntityGroup();
    group.size = 0;
    group.maxSize = GROUP_SIZE;

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

  floatEntity(id: number): EntityGroupHandle | undefined {
    throw new Error('Not implemented');
  }

  unfloatEntity(handle: EntityGroupHandle): [EntityGroupHandle, number] {
    if (handle.size !== 1) {
      throw new Error('The provided entity group handle is not floating.');
    }

    // To unfloat an entity, we need to find or create an entity group that
    // matches current entity's components.

    // To do that, we would need a signature (a bitset, or a string) to
    // distinguish each component pattern. This means we have to scan through
    // entity groups...
    // TODO: What if the entity group is overflown?
    const group = this._findEntityGroup(handle.group.hashCode)
      || this._createEntityGroup(handle.group);
    const targetHandle = new EntityGroupHandle(this, group);

    const offset = targetHandle.pushEntity();
    targetHandle.copyEntityFrom(handle, 0, offset);

    return [targetHandle, offset];
  }
}
