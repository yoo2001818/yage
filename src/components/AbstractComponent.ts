import { Component } from './Component';
import { ComponentAllocator } from './ComponentAllocator';
import { Signal } from '../Signal';
import { EntityGroup } from '../EntityGroup';

export abstract class AbstractComponent<T> implements Component<T> {
  name: string | null = null;

  pos: number | null = null;

  size: number = 0;

  allocator: ComponentAllocator;

  signal: Signal<[EntityGroup]>;

  constructor() {
    this.allocator = new ComponentAllocator((size) => this._allocateNew(size));
    this.signal = new Signal();
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
    this.allocator.unallocate(offset, size);
  }

  abstract _allocateNew(size: number): number;

  abstract get(pos: number): T;

  abstract set(pos: number, source: T): void;

  abstract copyTo(pos: number, target: T): void;

  abstract copyBetween(src: number, dest: number): void;

  markChanged(group: EntityGroup): void {
    this.signal.emit(group);
  }

  addListener(callback: (group: EntityGroup) => void): void {
    this.signal.subscribe(callback);
  }

  removeListener(callback: (group: EntityGroup) => void): void {
    this.signal.unsubscribe(callback);
  }

}
