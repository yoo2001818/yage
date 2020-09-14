import { AbstractComponent } from './AbstractComponent';

function DEFAULT_ON_COPY<T>(from: T, to: T): void {
  Object.assign(to, from);
}

export class MutableComponent<T> extends AbstractComponent<T> {
  onCreate: () => T;

  onCopy: (from: T, to: T) => void;

  items: T[];

  constructor(
    onCreate: () => T,
    onCopy: (from: T, to: T) => void = DEFAULT_ON_COPY,
  ) {
    super();
    this.onCreate = onCreate;
    this.onCopy = onCopy;
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
    this.onCopy(source, this.get(pos));
  }

  copyTo(pos: number, target: T): void {
    this.onCopy(this.get(pos), target);
  }

  copyBetween(src: number, dest: number): void {
    this.onCopy(this.get(src), this.get(dest));
  }
}
