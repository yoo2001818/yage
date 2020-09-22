import { EntityGroup } from './EntityGroup';
import { addGroupComponent, getGroupContainerHashCode } from './EntityGroupMethods';
import { EntityStore } from './EntityStore';

export class EntityGroupContainer {
  components: boolean[] = [];

  hashCode: number = 0;

  entityGroups: EntityGroup[] = [];

  freeEntityGroups: EntityGroup[] = [];

  init(components: boolean[]): void {
    this.components = components;
    this.hashCode = getGroupContainerHashCode(components);
  }

  allocate(store: EntityStore): EntityGroup {
    // Do we have any free entity groups?
    if (this.freeEntityGroups.length > 0) {
      const group = this.freeEntityGroups[this.freeEntityGroups.length - 1];
      if (group.size + 1 >= group.maxSize) {
        this.freeEntityGroups.pop();
      }
      return group;
    }
    // Create new group
    return this._createGroup(store);
  }

  unallocate(group: EntityGroup): void {
    // TODO: This is not safe
    if (group.size === group.maxSize - 1) {
      this.freeEntityGroups.push(group);
    }
  }

  _createGroup(store: EntityStore): EntityGroup {
    const group = store._createEntityGroup();
    group.maxSize = 32;

    for (let i = 0; i < this.components.length; i += 1) {
      if (this.components[i]) {
        addGroupComponent(group, store.components[i]);
      }
    }

    this.entityGroups.push(group);
    this.freeEntityGroups.push(group);
    return group;
  }

  _removeGroup(group: EntityGroup): void {

  }

  forEachGroup(callback: (group: EntityGroup) => void): void {

  }
}
