import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntity } from './PagedEntity';
import { PagedEntityPage } from './PagedEntityPage';
import { EntityQuery } from '../types';

export class PagedEntityQuery implements EntityQuery {
  store: PagedEntityStore;

  criterias: string[];

  constructor(store: PagedEntityStore) {
    this.store = store;
    this.criterias = [];
  }

  withComponents(...names: string[]): void {
    this.criterias = names;
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    this.store.forEach((entity) => {
      if (this.criterias.every((component) => entity.has(component))) {
        callback(entity);
      }
    });
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
    this.store.forEach((entity) => {
      if (this.criterias.every((component) => entity.has(component))) {
        callback(new PagedEntityPage(this.store, [entity]));
      }
    });
  }
}
