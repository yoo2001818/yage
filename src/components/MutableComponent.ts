import { Component } from './Component';
import { ComponentAllocator } from './ComponentAllocator';

function DEFAULT_ON_COPY<T>(from: T, to: T): void {
  Object.assign(to, from);
}

export class MutableComponent<T> implements Component<T> {
  onCreate: () => T;

  onCopy: (from: T, to: T) => void;

  items: T[];

  allocator: ComponentAllocator;

  name: string | null = null;

  pos: number | null = null;

  constructor(
    onCreate: () => T,
    onCopy: (from: T, to: T) => void = DEFAULT_ON_COPY,
  ) {
    this.onCreate = onCreate;
    this.onCopy = onCopy;
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
    this.onCopy(source, this.get(pos));
  }

  copyTo(pos: number, target: T): void {
    this.onCopy(this.get(pos), target);
  }

  copyBetween(src: number, dest: number): void {
    this.onCopy(this.get(src), this.get(dest));
  }
}
