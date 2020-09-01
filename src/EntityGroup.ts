/**
 * EntityGroup contains entities of same type. In principle, EntityGroup is
 * nothing more than an allocation table; it just specifies list of components
 * and the offset of each component.
 */
export class EntityGroup {
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
