import { ComponentArray } from './ComponentArray';

const GROUP_SIZE = 32;

export class Component<T> {
  name: string;

  pos: number;

  array: ComponentArray<T>;

  freedOffsets: number[];

  freedSingleOffsets: number[];

  constructor(
    name: string,
    pos: number,
    array: ComponentArray<T>,
  ) {
    this.name = name;
    this.pos = pos;
    this.array = array;
    this.freedOffsets = [];
    this.freedSingleOffsets = [];
  }

  allocate(size: number): number {
    // This is similiar to malloc. We need to find an offset that can fulfill
    // given size.
    // Well, let's be simple! We'll only support group size and size of 1.
    if (size === 1) {
      // First, try to read if any single offsets exist...
      if (this.freedSingleOffsets.length > 0) {
        return this.freedSingleOffsets.pop() as number;
      }
      // Otherwise, borrow one block and use it
      const addr = this.allocate(GROUP_SIZE);
      for (let i = 1; i < GROUP_SIZE; i += 1) {
        this.freedSingleOffsets.push(addr + i);
      }
      return addr;
    }
    if (size === GROUP_SIZE) {
      if (this.freedOffsets.length > 0) {
        return this.freedOffsets.pop() as number;
      }
      // Assign more
      const offset = this.array.size;
      this.array.allocate(offset + GROUP_SIZE);
      return offset;
    }
    throw new Error(`Size ${size} is unsupported for now`);
  }

  unallocate(offset: number, size: number): number {

  }
}
