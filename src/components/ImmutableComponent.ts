import { Component } from './Component';
import { ComponentAllocator } from './ComponentAllocator';

export class ImmutableComponent<T> implements Component<T> {
  onCreate: () => T;

  items: T[];

  allocator: ComponentAllocator;

  name: string | null = null;

  pos: number | null = null;

  constructor(
    onCreate: () => T,
  ) {
    this.onCreate = onCreate;
    this.items = [];
    this.allocator = new ComponentAllocator((size) => {
      const start = this.items.length;
      const end = start + size;
      this.items.length = end;
      for (let i = start; i < end; i += 1) {
        this.items[i] = this.onCreate();
      }
      return start;
    });
  }

  get size(): number {
    return this.items.length;
  }

  register(name: string, pos: number): void {
    this.name = name;
    this.pos = pos;
  }

  unregister(): void {
    this.name = null;
    this.pos = null;
  }

  allocate(size: number): number {
    return this.allocator.allocate(size);
  }

  unallocate(offset: number, size: number): void {
    return this.allocator.unallocate(offset, size);
  }

  get(pos: number): T {
    if (pos >= this.items.length) {
      throw new Error('Component overflown');
    }
    return this.items[pos];
  }

  set(pos: number, source: T): void {
    this.items[pos] = source;
  }

  copyTo(): void {
    throw new Error('Immutable data does not support copying');
  }

  copyBetween(src: number, dest: number): void {
    this.items[dest] = this.items[src];
  }
}
