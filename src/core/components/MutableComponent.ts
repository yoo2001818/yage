import { AbstractComponent } from './AbstractComponent';
import {
  ComponentFromJSON,
  ComponentToJSON,
  defaultComponentFromJSON,
  defaultComponentToJSON,
} from './Component';
import { ComponentAllocator } from './ComponentAllocator';

function defaultOnCopy<T>(from: T, to: T): void {
  Object.assign(to, from);
}

export class MutableComponent<T> extends AbstractComponent<T> {
  onCreate: () => T;

  onCopy: (from: T, to: T) => void;

  items: T[];

  allocator: ComponentAllocator;

  size: number;

  constructor(
    onCreate: () => T,
    onCopy: (from: T, to: T) => void = defaultOnCopy,
    fromJSON: ComponentFromJSON<T> = defaultComponentFromJSON,
    toJSON: ComponentToJSON<T> = defaultComponentToJSON,
  ) {
    super(fromJSON, toJSON);
    this.onCreate = onCreate;
    this.onCopy = onCopy;
    this.items = [];
    this.size = 0;
    this.allocator = new ComponentAllocator(16, (reqSize) => {
      const start = this.items.length;
      const end = start + reqSize;
      this.items.length = end;
      this.size = end;
      for (let i = start; i < end; i += 1) {
        this.items[i] = this.onCreate();
      }
      return start;
    });
    this.itemFromJSON = fromJSON;
    this.itemToJSON = toJSON;
  }

  createOffset(value: T, size: number): number {
    return this.allocator.allocate(size);
  }

  createOffsetFromOffset(offset: number, size: number): number {
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
    this.onCopy(source, this.get(offset));
  }

  copyTo(offset: number, target: T): void {
    this.onCopy(this.get(offset), target);
  }

  copyBetween(src: number, dest: number): void {
    this.onCopy(this.get(src), this.get(dest));
  }
}
