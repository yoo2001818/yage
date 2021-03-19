import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { Signal } from '../../Signal';

import { EntityStore } from '../types';
import { Component } from '../../components';

export class PagedEntityStore implements EntityStore {
  componentArrays: Component<unknown>[];

  entities: (PagedEntity | null)[];

  deletedIds: number[];

  signals: Map<string, Signal<[PagedEntityPage]>>;

  constructor() {
    this.entities = [];
    this.deletedIds = [];
    this.signals = new Map();
  }

  get(id: number): PagedEntity | null {
    return this.entities[id];
  }

  create(): PagedEntity {
    const newId = this.deletedIds.pop();
    if (newId != null) {
      const entity = new PagedEntity(this, newId);
      this.entities[newId] = entity;
      return entity;
    }
    const entity = new PagedEntity(this, this.entities.length);
    this.entities.push(entity);
    return entity;
  }

  createFrom(object: { [key: string]: unknown }): PagedEntity {
    const entity = this.create();
    entity.fromObject(object);
    return entity;
  }

  delete(id: number): void {
    if (this.entities[id] == null) return;
    this.entities[id] = null;
    this.deletedIds.push(id);
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(entity);
    });
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(new PagedEntityPage(this, [entity]));
    });
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
