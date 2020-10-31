import { Component } from './Component';
import { Signal } from '../Signal';
import { EntityGroup } from '../EntityGroup';

export class UnisonComponent<T> implements Component<T> {
  name: string | null = null;

  pos: number | null = null;

  size: number = 0;

  unison: boolean = true;

  signal: Signal<[EntityGroup, number, number]>;

  list: T[] = [];

  constructor() {
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

  allocate(): number {
    return -1;
  }

  unallocate(): void {
  }

  get(pos: number): T {
    return this.list[pos];
  }

  set(): void {
    throw new Error('Setting is not supported for unison component');
  }

  copyTo(): void {
    throw new Error('Setting is not supported for unison component');
  }

  copyBetween(): void {
    throw new Error('Setting is not supported for unison component');
  }

  markChanged(group: EntityGroup, start = 0): void {
    this.signal.emit(group, start, 1);
  }

  subscribe(
    callback: (group: EntityGroup, start: number, size: number) => void,
  ): void {
    this.signal.subscribe(callback);
  }

  unsubscribe(
    callback: (group: EntityGroup, start: number, size: number) => void,
  ): void {
    this.signal.unsubscribe(callback);
  }

  getUnisonOffset(value: T): number {
    // TODO Make it faster (duh)
    const index = this.list.findIndex((v) => v === value);
    if (index !== -1) return index;
    this.list.push(value);
    return this.list.length - 1;
  }
}
