import { SimpleEntityStore } from './SimpleEntityStore';
import { SimpleEntity } from './SimpleEntity';
import { EntityPage } from '../types';

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

  forEachPage(callback: (page: EntityPage) => void): void {
    // TODO
  }

}
