/**
 * Component maintains an array of each component. It stores actual data
 * of each entities.
 *
 * However, the entity itself is represented using EntityGroup. Component
 * only stores component data. Component is nothing more than an expandable
 * array, while EntityGroup specifies which offset to read/write. It can be
 * understood as a block device; EntityGroup acts as a 'file allocation table'.
 */
export interface Component<T> {
  name: string | null,
  pos: number | null,
  size: number,

  register(name: string, pos: number): void,
  unregister(): void,

  allocate(size: number): number,
  unallocate(offset: number, size: number): void,

  get(pos: number): T,
  set(pos: number, source: T): void,
  copyTo(pos: number, target: T): void,
  copyBetween(src: number, dest: number): void,

  markChanged(pos: number): void,
}