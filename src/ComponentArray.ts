/**
 * ComponentArray maintains an array of each component. It stores actual data
 * of each entities.
 *
 * However, the entity itself is represented using EntityGroup. ComponentArray
 * only stores component data. ComponentArray is nothing more than an expandable
 * array, while EntityGroup specifies which offset to read/write. It can be
 * understood as a block device; EntityGroup acts as a 'file allocation table'.
 */
export interface ComponentArray<T> {
  size: number,
  allocate(size: number): void,
  get(pos: number): T,
  copyFrom(pos: number, source: T): void,
  copyTo(pos: number, target: T): void,
}

export class BaseComponentArray<T> implements ComponentArray<T> {
  onCreate: () => T;

  onCopy: (from: T, to: T) => void;

  items: T[];

  constructor(
    onCreate: () => T,
    onCopy: (from: T, to: T) => void = Object.assign,
  ) {
    this.onCreate = onCreate;
    this.onCopy = onCopy;
    this.items = [];
  }

  get size(): number {
    return this.items.length;
  }

  allocate(size: number): void {
    if (this.items.length >= size) return;
    const prevPos = this.items.length;
    this.items.length = size;
    for (let i = prevPos; i < size; i += 1) {
      this.items[i] = this.onCreate();
    }
  }

  get(pos: number): T {
    if (pos >= this.items.length) {
      throw new Error('ComponentArray overflown');
    }
    return this.items[pos];
  }

  copyFrom(pos: number, source: T): void {
    this.onCopy(source, this.get(pos));
  }

  copyTo(pos: number, target: T): void {
    this.onCopy(this.get(pos), target);
  }
}
