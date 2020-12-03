import { AbstractComponent } from './AbstractComponent';
import { ComponentAllocator } from './ComponentAllocator';

export class ImmutableComponent<T> extends AbstractComponent<T> {
  items: T[];

  allocator: ComponentAllocator;

  size: number;

  constructor() {
    super();
    this.items = [];
    this.size = 0;
    this.allocator = new ComponentAllocator(16, (reqSize) => {
      const pos = this.size;
      this.size += reqSize;
      return pos;
    });
  }

  createOffset(value: T, size: number): number {
    return this.allocator.allocate(size);
  }

  deleteOffset(offset: number, size: number): void {
    this.allocator.unallocate(offset, size);
  }

  get(offset: number): T {
    if (offset >= this.items.length) {
      throw new Error('Component overflown');
    }
    return this.items[offset];
  }

  set(offset: number, source: T): void {
    this.items[offset] = source;
  }

  copyTo(): void {
    throw new Error('Immutable data does not support copying');
  }

  copyBetween(src: number, dest: number): void {
    this.items[dest] = this.items[src];
  }
}
