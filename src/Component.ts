import { ComponentAllocator } from './ComponentAllocator';

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
}

function DEFAULT_ON_COPY<T>(from: T, to: T): void {
  Object.assign(to, from);
}

export class BaseComponent<T> implements Component<T> {
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
