import { AbstractComponent } from './AbstractComponent';

export class ImmutableComponent<T> extends AbstractComponent<T> {
  onCreate: () => T;

  items: T[];

  constructor(
    onCreate: () => T,
  ) {
    super();
    this.onCreate = onCreate;
    this.items = [];
  }

  _allocateNew(size: number): number {
    const start = this.items.length;
    const end = start + size;
    this.items.length = end;
    for (let i = start; i < end; i += 1) {
      this.items[i] = this.onCreate();
    }
    return start;
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
