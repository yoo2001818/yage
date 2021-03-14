import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityQuery } from './SimpleEntityQuery';
import { Signal } from '../../Signal';

import { EntityStore } from '../types';

export class SimpleEntityStore implements EntityStore {
  entities: (SimpleEntity | null)[];

  deletedIds: number[];

  constructor() {
    this.entities = [];
    this.deletedIds = [];
  }

  get(id: number): SimpleEntity | null {
    return this.entities[id];
  }

  create(): SimpleEntity {
    const newId = this.deletedIds.pop();
    if (newId != null) {
      const entity = new SimpleEntity(newId);
      this.entities[newId] = entity;
      return entity;
    }
    const entity = new SimpleEntity(this.entities.length);
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

  query(): SimpleEntityQuery {
    return new SimpleEntityQuery(this);
  }

  getSignal(name: string): Signal<[EntityPage]> {
    // noop
  }

  toJSON(): unknown {

  }

  fromJSON(value: unknown): void {

  }
}
