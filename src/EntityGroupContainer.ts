import { EntityGroup } from './EntityGroup';
import { addGroupComponent, getGroupContainerHashCode, removeGroupEntity } from './EntityGroupMethods';
import { EntityStore } from './EntityStore';
import { removeItem } from './utils/array';

export class EntityGroupContainer {
  id: number = 0;

  components: boolean[] = [];

  hashCode: number = 0;

  groups: EntityGroup[] = [];

  freeGroups: EntityGroup[] = [];

  init(components: boolean[]): void {
    this.components = components;
    this.hashCode = getGroupContainerHashCode(components);
  }

  createEntitySlot(store: EntityStore): [EntityGroup, number] {
    // Do we have any free entity groups?
    if (this.freeGroups.length > 0) {
      const group = this.freeGroups[this.freeGroups.length - 1];
      const index = group.size;
      if (group.size + 1 >= group.maxSize) {
        this.freeGroups.pop();
      }
      group.size += 1;
      return [group, index];
    }
    // If not, retrieve entity group from the store
    const group = store.createEntityGroup();
    group.parentId = this.id;
    group.parentIndex = this.groups.length;
    group.maxSize = Math.min(2048, 2 ** this.groups.length);
    this.groups.push(group);

    // TODO This is not ideal
    for (let i = 0; i < this.components.length; i += 1) {
      if (this.components[i]) {
        addGroupComponent(group, store.components[i]);
      }
    }
    group.size += 1;
    this.freeGroups.push(group);

    return [group, 0];
  }

  releaseEntitySlot(
    store: EntityStore,
    group: EntityGroup,
    index: number,
  ): void {
    if (group.size === group.maxSize) {
      this.freeGroups.push(group);
    }
    // We're responsible for unallocating entity data from the entity group.
    removeGroupEntity(store, group, index);
    if (group.size === 0) {
      // If the entity group is no longer used, we have to snoop through
      // the groups array and remove it.
      // TODO: Erm, managing this would be an issue - index of this frequently
      // changes. Assuming freeGroups won't contain data too much, we'll just
      // iterate them...
      this.freeGroups = this.freeGroups.filter((v) => v !== group);
      removeItem(this.groups, group.parentIndex);
    }
  }
}
