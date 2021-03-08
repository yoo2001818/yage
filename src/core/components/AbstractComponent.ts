import {
  Component,
  ComponentFromJSON,
  ComponentToJSON,
  defaultComponentFromJSON,
  defaultComponentToJSON,
} from './Component';
import { Signal } from '../Signal';
import { EntityPage } from '../store/EntityPage';

export abstract class AbstractComponent<T> implements Component<T> {
  name: string | null = null;

  pos: number | null = null;

  signal: Signal<[EntityPage, number, number]>;

  itemFromJSON: ComponentFromJSON<T>;

  itemToJSON: ComponentToJSON<T>;

  constructor(
    fromJSON: ComponentFromJSON<T> = defaultComponentFromJSON,
    toJSON: ComponentToJSON<T> = defaultComponentToJSON,
  ) {
    this.signal = new Signal();
    this.itemFromJSON = fromJSON;
    this.itemToJSON = toJSON;
  }

  register(name: string, pos: number): void {
    this.name = name;
    this.pos = pos;
  }

  unregister(): void {
    this.name = null;
    this.pos = null;
  }

  abstract createOffset(value: T, size: number): number;

  abstract createOffsetFromOffset(offset: number, size: number): number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  probeOffset(value: T): number {
    return 1;
  }

  abstract deleteOffset(offset: number, size: number): void;

  abstract get(pos: number): T;

  abstract set(pos: number, source: T): void;

  abstract copyTo(pos: number, target: T): void;

  abstract copyBetween(src: number, dest: number): void;

  fromJSON(
    payload: unknown,
    mapId?: (id: unknown) => number | null,
  ): T {
    return this.itemFromJSON(payload, mapId);
  }

  toJSON(
    item: T,
    mapId?: (id: number | null) => unknown,
  ): unknown {
    return this.itemToJSON(item, mapId);
  }

  markChanged(group: EntityPage, start = 0, size = group.size): void {
    this.signal.emit(group, start, size);
  }

  subscribe(
    callback: (group: EntityPage, start: number, size: number) => void,
  ): void {
    this.signal.subscribe(callback);
  }

  unsubscribe(
    callback: (group: EntityPage, start: number, size: number) => void,
  ): void {
    this.signal.unsubscribe(callback);
  }

  getOffsetHash(offset: number): number {
    if (offset === -1) return 0;
    return 1;
  }

  isOffsetCompatible(a: number, b: number): boolean {
    return (a === -1) === (b === -1);
  }

  isUnison(): boolean {
    return false;
  }
}
