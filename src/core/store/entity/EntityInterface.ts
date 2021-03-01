import { Component } from '../../components/Component';
import { ValueIsComponent, ValueOfComponent } from '../types';

export interface Entity<D extends ValueIsComponent<D> = any> {
  id: number;

  remove<K extends keyof D>(key: K): void;
  remove<T>(component: Component<T> | string): void;
  has<K extends keyof D>(key: K): boolean;
  has<T>(component: Component<T> | string): boolean;
  get<K extends keyof D>(key: K): ValueOfComponent<D[K]>;
  get<T>(component: Component<T> | string): T;
  set<K extends keyof D>(key: K, source: ValueOfComponent<D[K]>): void;
  set<T>(component: Component<T> | string, source: T): void;
  // getComponents(): Component<unknown>[];
  markChanged<T>(component: Component<T> | string): void;
  toJSON(): unknown;
  fromJSON(value: unknown): void;
}
