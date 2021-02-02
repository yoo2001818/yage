import { EntityGroup } from '../store/EntityGroup';

/**
 * Component maintains an array of each component. It stores actual data
 * of each entities.
 *
 * However, the entity itself is represented using EntityGroup. Component
 * only stores component data. Component is nothing more than an expandable
 * array, while EntityGroup specifies which offset to read/write. It can be
 * understood as a block device; EntityGroup acts as a 'file allocation table'.
 */
export interface Component<T> {
  name: string | null,
  pos: number | null,

  register(name: string, pos: number): void,
  unregister(): void,

  createOffset(value: T, size: number): number,
  createOffsetFromOffset(offset: number, size: number): number,
  probeOffset(value: T): number,
  deleteOffset(offset: number, size: number): void,

  get(offset: number): T,
  set(offset: number, source: T): void,
  copyTo(offset: number, target: T): void,
  copyBetween(src: number, dest: number): void,

  fromJSON(
    payload: unknown,
    mapId?: (id: unknown) => number | null,
  ): T,
  toJSON(value: T, mapId?: (id: number | null) => unknown): unknown,

  markChanged(group: EntityGroup, start?: number, size?: number): void,
  subscribe(
    callback: (group: EntityGroup, start: number, size: number) => void,
  ): void,
  unsubscribe(
    callback: (group: EntityGroup, start: number, size: number) => void,
  ): void,

  getOffsetHash(offset: number): number,
  isOffsetCompatible(a: number, b: number): boolean,
  isUnison(): boolean,
}

export interface ComponentFromJSON<T> {
  (payload: unknown, mapId?: (id: unknown) => number | null): T,
}

export interface ComponentToJSON<T> {
  (item: T, mapId?: (id: number | null) => unknown): unknown,
}

export function defaultComponentFromJSON<T>(payload: unknown): T {
  return payload as T;
}

export function defaultComponentToJSON<T>(item: T): unknown {
  return item;
}
