import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityQuery } from './SimpleEntityQuery';
import { SimpleEntityPage } from './SimpleEntityPage';
import { Signal } from '../../Signal';

import { EntityStore } from '../types';

export class SimpleEntityStore implements EntityStore {
  entities: (SimpleEntity | null)[];

  deletedIds: number[];

  signals: Map<string, Signal<[SimpleEntityPage]>>;

  constructor() {
    this.entities = [];
    this.deletedIds = [];
    this.signals = new Map();
  }

  get(id: number): SimpleEntity | null {
    return this.entities[id];
  }

  create(): SimpleEntity {
    const newId = this.deletedIds.pop();
    if (newId != null) {
      const entity = new SimpleEntity(this, newId);
      this.entities[newId] = entity;
      return entity;
    }
    const entity = new SimpleEntity(this, this.entities.length);
    this.entities.push(entity);
    return entity;
  }

  delete(id: number): void {
    if (this.entities[id] == null) return;
    this.entities[id] = null;
    this.deletedIds.push(id);
  }

  forEach(callback: (entity: SimpleEntity) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(entity);
    });
  }

  forEachPage(callback: (page: SimpleEntityPage) => void): void {
    this.entities.forEach((entity) => {
      if (entity == null) return;
      callback(new SimpleEntityPage(this, [entity]));
    });
  }

  query(): SimpleEntityQuery {
    return new SimpleEntityQuery(this);
  }

  getSignal(name: string): Signal<[SimpleEntityPage]> {
    let signal = this.signals.get(name);
    if (signal == null) {
      signal = new Signal<[SimpleEntityPage]>();
      this.signals.set(name, signal);
    }
    return signal;
  }
}
