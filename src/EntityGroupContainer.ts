import { EntityGroup } from './EntityGroup';

export class EntityGroupContainer {
  components: boolean[] = [];

  hashCode: number = 0;

  entityGroups: EntityGroup[] = [];

  freeEntityGroups: EntityGroup[] = [];

  init(components: boolean[]): void {
    this.components = components;
    // TODO Update hashcode
  }

  allocate(): EntityGroup {

  }

  unallocate(group: EntityGroup): void {

  }

  _createGroup(): EntityGroup {

  }

  _removeGroup(group: EntityGroup): void {

  }

  forEachGroup(callback: (group: EntityGroup) => void): void {

  }
}
