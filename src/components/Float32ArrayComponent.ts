import { AbstractComponent } from './AbstractComponent';
import {
  ComponentFromJSON,
  ComponentToJSON,
  defaultComponentFromJSON,
  defaultComponentToJSON,
} from './Component';
import { ComponentAllocator } from './ComponentAllocator';

const PAGE_SIZE = 65536;

export class Float32ArrayComponent<T = Float32Array>
  extends AbstractComponent<T> {
  onCreate: (buffer: Float32Array) => T;

  onGetBuffer: (value: T) => Float32Array;

  dimensions: number;

  allocator: ComponentAllocator;

  arrays: Float32Array[];

  size: number;

  constructor(
    dimensions: number,
    onCreate: (buffer: Float32Array) => T,
    onGetBuffer: (value: T) => Float32Array,
    fromJSON: ComponentFromJSON<T> = defaultComponentFromJSON,
    toJSON: ComponentToJSON<T> = defaultComponentToJSON,
  ) {
    super(fromJSON, toJSON);
    this.onCreate = onCreate;
    this.onGetBuffer = onGetBuffer;
    this.dimensions = dimensions;
    this.arrays = [];
    this.size = 0;
    this.allocator = new ComponentAllocator(PAGE_SIZE, (reqSize) => {
      const start = this.size;
      const end = start + reqSize;
      const page = start / PAGE_SIZE | 0;
      while (this.arrays.length <= page) {
        this.arrays.push(new Float32Array(PAGE_SIZE * this.dimensions));
      }
      this.size = end;
      return start;
    });
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

  get(pos: number): T {
    if (pos >= this.size) {
      throw new Error('Component overflown');
    }
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    return this.onCreate(array.subarray(offset, offset + this.dimensions));
  }

  set(pos: number, source: T): void {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    array.set(this.onGetBuffer(source), offset);
  }

  getArrayOf(pos: number): Float32Array {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * this.dimensions;
    const array = this.arrays[page];
    return array.subarray(offset);
  }

  copyTo(): void {
    throw new Error('Immutable data does not support copying');
  }

  copyBetween(src: number, dest: number): void {
    const destPage = dest / PAGE_SIZE | 0;
    const destOffset = (dest % PAGE_SIZE) * this.dimensions;
    const destArray = this.arrays[destPage];
    destArray.set(
      this.getArrayOf(src).subarray(0, this.dimensions),
      destOffset,
    );
  }
}

export function createFloat32ArrayComponent(
  dimensions: number,
): Float32ArrayComponent<Float32Array> {
  return new Float32ArrayComponent(
    dimensions,
    (v) => v,
    (v) => v,
  );
}
