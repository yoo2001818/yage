/**
 * EntityPage contains entities of same type. In principle, EntityGroup is
 * nothing more than an allocation table; it just specifies list of components
 * and the offset of each component.
 */
export class EntityPage {
  id: number = 0;

  // The ID of the parent group container. If the group is "floating", -1 is
  // assigned instead.
  parentId: number = -1;

  // The index of the parent group container. This is the physical offset of
  // group container's array. When the entity group gets removed, this offset
  // will be used to quickly identify which offset to remove.
  // (We won't push/pull the entire list, instead pop and swapping will be used)
  parentIndex: number = 0;

  disposed: boolean = false;

  size: number = 0;

  maxSize: number = 0;

  /**
   * Offset of each component. If the component is not present in EntityGroup,
   * '-1' is specified.
   */
  offsets: number[] = [];

  // TODO: Should this be a bitset? or a hash code to just filter out items?
  hashCode: number = 0;
}
