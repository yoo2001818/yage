import { SimpleEntityStore } from './SimpleEntityStore';
import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityPage } from './SimpleEntityPage';
import { EntityQuery } from '../types';

export class SimpleEntityQuery implements EntityQuery {
  store: SimpleEntityStore;

  criterias: string[];

  constructor(store: SimpleEntityStore) {
    this.store = store;
    this.criterias = [];
  }

  withComponents(...names: string[]): void {
    this.criterias = names;
  }

  forEach(callback: (entity: SimpleEntity) => void): void {
    this.store.forEach((entity) => {
      if (this.criterias.every((component) => entity.has(component))) {
        callback(entity);
      }
    });
  }

  forEachPage(callback: (page: SimpleEntityPage) => void): void {
    this.store.forEach((entity) => {
      if (this.criterias.every((component) => entity.has(component))) {
        callback(new SimpleEntityPage([entity]));
      }
    });
  }
}
