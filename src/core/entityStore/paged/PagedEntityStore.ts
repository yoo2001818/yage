import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityClass } from './PagedEntityClass';
import { Signal } from '../../Signal';

import { EntityStore } from '../types';
import { Component } from '../../components';

export class PagedEntityStore implements EntityStore {
  componentArrays: Component<unknown>[];

  classes: PagedEntityClass[];

  signals: Map<string, Signal<[PagedEntityPage]>>;

  constructor() {
    this.componentArrays = [];
    this.classes = [];
    this.signals = new Map();
  }

  get(id: number): PagedEntity | null {
  }

  create(): PagedEntity {
  }

  createFrom(object: { [key: string]: unknown }): PagedEntity {
    const entity = this.create();
    entity.fromObject(object);
    return entity;
  }

  delete(id: number): void {
  }

  forEach(callback: (entity: PagedEntity) => void): void {
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
  }

  query(): PagedEntityQuery {
    return new PagedEntityQuery(this);
  }

  getSignal(name: string): Signal<[PagedEntityPage]> {
    let signal = this.signals.get(name);
    if (signal == null) {
      signal = new Signal<[PagedEntityPage]>();
      this.signals.set(name, signal);
    }
    return signal;
  }
}
