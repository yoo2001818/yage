import { AbstractComponent } from './AbstractComponent';

const PAGE_SIZE = 1024;

export class Float32ArrayComponent extends AbstractComponent<Float32Array> {
  dimensions: number;

  arrays: Float32Array[];

  constructor(dimensions: number) {
    super();
    this.dimensions = dimensions;
    // The array is separated to pages.
    this.arrays = [];
  }

  _allocateNew(size: number): number {
    const start = this.size;
    const end = start + size;
    const page = start / PAGE_SIZE | 0;
    while (this.arrays.length <= page) {
      this.arrays.push(new Float32Array(PAGE_SIZE * this.dimensions));
    }
    this.size = end;
    return start;
  }

  get(pos: number): Float32Array {
    if (pos >= this.size) {
      throw new Error('Component overflown');
    }
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    return array.subarray(offset, offset + this.dimensions);
  }

  set(pos: number, source: Float32Array | number[]): void {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    array.set(source, offset);
  }

  getArrayOf(pos: number): [Float32Array, number] {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    return [array, offset];
  }

  copyTo(): void {
    throw new Error('Immutable data does not support copying');
  }

  copyBetween(src: number, dest: number): void {
    const destPage = dest / PAGE_SIZE | 0;
    const destOffset = (dest % PAGE_SIZE) * this.dimensions;
    const destArray = this.arrays[destPage];
    destArray.set(this.get(src), destOffset);
  }
}
