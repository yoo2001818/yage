import { PagedEntity } from './PagedEntity';
import { PagedEntityStore } from './PagedEntityStore';

import { EntityPage } from '../types';

export class PagedEntityPage implements EntityPage {
  // parentId: number;

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
    const output: PagedEntity[] = [];
    this.forEach((entity) => output.push(entity));
    return output;
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    for (let i = 0; i < this.size; i += 1) {
      callback(new PagedEntity(this.store, this, i));
    }
  }

  emit(name: string): void {
    this.store.getSignal(name).emit(this);
  }

  acquireSlot(): number {
    if (this.size >= this.maxSize) {
      throw new Error('Page overflow');
    }
    const allocated = this.size;
    this.size += 1;
    return allocated;
  }

  releaseSlot(index: number): void {
    // Copy the last item's contents to here, then decrease the size counter
    this.size -= 1;
  }
}
