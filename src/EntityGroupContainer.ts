import { EntityGroup } from './EntityGroup';
import { addGroupComponent, getGroupContainerHashCode } from './EntityGroupMethods';
import { EntityStore } from './EntityStore';

class EntityGroupNode {
  group: EntityGroup;

  next: EntityGroupNode | null = null;

  prev: EntityGroupNode | null = null;

  nextEmpty: EntityGroupNode | null = null;

  prevEmpty: EntityGroupNode | null = null;

  constructor(group: EntityGroup) {
    this.group = group;
  }
}

export class EntityGroupContainer {
  components: boolean[] = [];

  hashCode: number = 0;

  first: EntityGroupNode | null = null;

  last: EntityGroupNode | null = null;

  lastEmpty: EntityGroupNode | null = null;

  freeList: EntityGroupNode[] = [];

  init(components: boolean[]): void {
    this.components = components;
    this.hashCode = getGroupContainerHashCode(components);
  }

  allocate(store: EntityStore): EntityGroup {
    // Do we have any free entity groups?
    if (this.freeList.length > 0) {
      const node = this.freeList[this.freeList.length - 1];
      const { group } = node;
      if (group.size + 1 >= group.maxSize) {
        this.freeList.pop();
      }
      return group;
    }
    // Create new group
    return this._createGroup(store);
  }

  unallocate(group: EntityGroup): void {
    // TODO: This is not safe
    if (group.size === group.maxSize - 1) {
      this.freeList.push(group);
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

    const node = new EntityGroupNode(group);
    if (this.last == null || this.lastEmpty == null) {
      this.first = node;
      this.last = node;
      this.lastEmpty = node;
    } else {
      const { last, lastEmpty } = this;
      last.next = node;
      lastEmpty.next = node;
      lastEmpty.nextEmpty = node;
      node.prev = last;
      node.prevEmpty = lastEmpty;
    }
    this.freeList.push(node);
    return group;
  }

  _removeGroup(group: EntityGroup): void {

  }

  forEachGroup(callback: (group: EntityGroup) => void): void {
    let current = this.first;
    while (current != null) {
      callback(current.group);
      current = current.next;
    }
  }
}
