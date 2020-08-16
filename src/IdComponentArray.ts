import { ComponentArray } from './ComponentArray';

export class IdComponentArray implements ComponentArray<number> {
  ids: number[] = [];

  get size(): number {
    return this.ids.length;
  }

  allocate(size: number): void {
    if (this.ids.length >= size) return;
    const prevPos = this.ids.length;
    this.ids.length = size;
    for (let i = prevPos; i < size; i += 1) {
      this.ids[i] = i;
    }
  }

  get(pos: number): number {
    if (pos >= this.ids.length) {
      throw new Error('ComponentArray overflown');
    }
    return this.ids[pos];
  }

  copyFrom(pos: number, source: number): void {
    this.ids[pos] = source;
  }

  copyTo(): void {
    throw new Error('ID is immutable; it cannot be copied to.');
  }
}
