import { EntityPage } from './EntityPage';
import {
  copyGroupComponents,
  getGroupContainerHashCode,
  removeGroupEntity,
} from './EntityGroupMethods';
import { EntityStore } from './EntityStore';
import { removeItem } from '../../utils/array';

const ASSIGN_TABLE = [1, 4, 16, 64, 128, 256, 512, 1024, 2048];

export class EntityClass {
  id: number = 0;

  // This contains the 'master' offset information used to initialize the other
  // groups.
  offsets: number[] = [];

  hashCode: number = 0;

  groups: EntityPage[] = [];

  freeGroups: EntityPage[] = [];

  init(
    offsets: number[],
    store: EntityStore,
  ): void {
    this.offsets = offsets;
    this.hashCode = getGroupContainerHashCode(offsets, store);
  }

  createEntitySlot(store: EntityStore): [EntityPage, number] {
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
    group.maxSize = ASSIGN_TABLE.length > this.groups.length
      ? ASSIGN_TABLE[this.groups.length]
      : 2048;
    this.groups.push(group);

    copyGroupComponents(store, this.offsets, group);
    group.size += 1;
    this.freeGroups.push(group);

    return [group, 0];
  }

  releaseEntitySlot(
    store: EntityStore,
    group: EntityPage,
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
      // We need to reconcile all parentIndexes! ...
      this.groups = this.groups.filter((v) => v !== group);
    }
  }
}
