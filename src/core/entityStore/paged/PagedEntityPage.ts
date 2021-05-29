import { PagedEntity } from './PagedEntity';
import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntityClass } from './PagedEntityClass';

import { EntityPage } from '../types';

export class PagedEntityPage implements EntityPage {
  entities: PagedEntity[];

  size: number;

  maxSize: number;

  entityClass: PagedEntityClass;

  store: PagedEntityStore;

  componentData: unknown[];

  constructor(
    store: PagedEntityStore,
    entityClass: PagedEntityClass,
    maxSize: number,
  ) {
    this.entities = [];
    this.size = 0;
    this.maxSize = maxSize;
    this.entityClass = entityClass;
    this.store = store;
    this.componentData = [];
  }

  getEntities(): PagedEntity[] {
    return this.entities;
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    this.entities.forEach(callback);
  }

  acquireSlot(entity: PagedEntity): number {
    if (this.size >= this.maxSize) {
      throw new Error('Page overflow');
    }
    const allocated = this.size;
    this.size += 1;
    this.entities[allocated] = entity;
    return allocated;
  }

  releaseSlot(index: number): void {
    // Copy the last item's contents to here, then decrease the size counter
    this.size -= 1;
  }
}
