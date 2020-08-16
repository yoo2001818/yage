import { ComponentArray } from './ComponentArray';
import { EntityGroup } from './EntityGroup';
import { EntityGroupHandle } from './EntityGroupHandle';

interface Component<T> {
  name: string,
  pos: number,
  array: ComponentArray<T>,
  deadBlocks: number[],
}

export class EntityStore {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  entityGroups: EntityGroup[] = [];

  deadEntityGroups: EntityGroup[] = [];

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

    // TODO: Initialize id component

    return new EntityGroupHandle(this, group);
  }

  removeEntity(handle: EntityGroupHandle): void {
    throw new Error('Not implemented');
  }

  getEntity(id: number): [EntityGroupHandle, number] {
    throw new Error('Not implemented');
  }

  floatEntity(id: number): EntityGroupHandle | undefined {
    throw new Error('Not implemented');
  }

  unfloatEntity(handle: EntityGroupHandle): void {
    throw new Error('Not implemented');
  }
}
