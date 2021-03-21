// import { PagedEntity } from './PagedEntity';
import { PagedEntityStore } from './PagedEntityStore';

import { EntityPage } from '../types';

export class PagedEntityPage implements EntityPage {
  parentId: number;

  offsets: number[];

  size: number;

  maxSize: number;

  // locked: boolean[];

  store: PagedEntityStore;

  constructor(
    store: PagedEntityStore,
    offsets: number[],
    maxSize: number,
  ) {
    this.store = store;
    this.offsets = offsets;
    this.maxSize = maxSize;
    this.size = 0;
  }

  getEntities(): PagedEntity[] {
    return this.entities;
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    this.entities.forEach(callback);
  }

  emit(name: string): void {
    this.store.getSignal(name).emit(this);
  }

  acquireSlot() {
    
  }

  releaseSlot() {
    
  }
}
