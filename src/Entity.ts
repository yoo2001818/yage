import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';

export class Entity {
  store: EntityStore;

  group: EntityGroup;

  index: number;

  constructor(store: EntityStore, group: EntityGroup, index: number) {
    this.store = store;
    this.group = group;
    this.index = index;
  }

  // We have to maintain underlying structure from here.
  float(): void {

  }

  unfloat(): void {

  }

  add<T>(component: Component<T> | string): void {

  }

  remove<T>(component: Component<T> | string): void {

  }

  has<T>(component: Component<T> | string): boolean {

  }

  get<T>(component: Component<T> | string): T {

  }

  destroy(): void {

  }

  getComponents(): Component<unknown>[] {
  }
  
  set<T>(
    component: Component<T> | string,
    source: T,
  ): void {

  }

  copyTo<T>(
    component: Component<T> | string,
    target: T,
  ): void {

  }

  serialize(): unknown {
  }

  deserialize(value: unknown): void {
  }
}
