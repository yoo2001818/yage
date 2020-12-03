import { AbstractComponent } from './AbstractComponent';

export class UnisonComponent<T> extends AbstractComponent<T> {
  size: number = 0;

  items: T[];

  equals: (a: T, b: T) => boolean;

  hashCode: (a: T) => number;

  constructor(
    equals: (a: T, b: T) => boolean,
    hashCode: (a: T) => number,
  ) {
    super();
    this.items = [];
    this.equals = equals;
    this.hashCode = hashCode;
  }

  createOffset(value: T): number {
    // TODO Make it faster (duh)
    const index = this.items.findIndex((v) => this.equals(v, value));
    if (index !== -1) return index;
    this.items.push(value);
    return this.items.length - 1;
  }

  createOffsetFromOffset(offset: number): number {
    return offset;
  }

  probeOffset(value: T): number {
    return this.createOffset(value);
  }

  deleteOffset(): void {
    // TODO We can run clean-up routines here
  }

  get(offset: number): T {
    if (offset >= this.items.length) {
      throw new Error('Component overflown');
    }
    return this.items[offset];
  }

  set(): void {
    // TODO Make this non-callable
  }

  copyTo(): void {
    throw new Error('Unison data does not support copying');
  }

  copyBetween(): void {
    throw new Error('Unison data does not support copying');
  }

  getOffsetHash(offset: number): number {
    if (offset === -1) return 0;
    return offset + 1;
  }

  isOffsetCompatible(a: number, b: number): boolean {
    return a === b;
  }

  isUnison(): boolean {
    return true;
  }
}
