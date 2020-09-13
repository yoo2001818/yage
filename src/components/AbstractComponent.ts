import { Component } from './Component';
import { EntityGroup } from '../EntityGroup';

export abstract class AbstractComponent<T> implements Component<T> {
  name: string | null;

  pos: number | null;

  size: number;

  abstract register(name: string, pos: number): void;

  abstract unregister(): void;

  abstract allocate(size: number): number;

  abstract unallocate(offset: number, size: number): void;

  abstract get(pos: number): T;

  abstract set(pos: number, source: T): void;

  abstract copyTo(pos: number, target: T): void;

  abstract copyBetween(src: number, dest: number): void;

  abstract markChanged(group: EntityGroup): void;

  abstract addListener(callback: (group: EntityGroup) => void): void;

  abstract removeListener(callback: (group: EntityGroup) => void): void;

}
