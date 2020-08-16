import { ComponentArray } from './ComponentArray';

export class IdComponentArray implements ComponentArray<number> {
  size: number = 0;

  allocate(size: number): void {
    if (this.size > size) return;
    this.size = size;
  }

  get(pos: number): number {
    // This should work AS LONG AS entity never gets reassigned; unfortunately
    // this is never the case.

    // TODO: Actually store data
    return pos;
  }

  copyFrom(): void {
    // No-op
  }

  copyTo(): void {
    // No-op
  }
}
