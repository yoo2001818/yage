import { ComponentArray } from './ComponentArray';
import { EntityGroup } from './EntityGroup';

interface Component<T> {
  name: string,
  array: ComponentArray<T>,
  deadBlocks: number[],
}

interface EntityGroupHandle {

}

export class EntityStore {
  components: Component<unknown>[] = [];

  componentNames: Record<string, number> = {};

  entityGroups: EntityGroup[] = [];

  deadEntityGroups: EntityGroup[] = [];

  addComponent<T>(name: string, array: ComponentArray<T>): void {
    throw new Error('Not implemented');
  }

  createEntity(): EntityGroupHandle {
    throw new Error('Not implemented');
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
