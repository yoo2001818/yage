import { getGroupContainerHashCode } from './utils';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntity } from './PagedEntity';

export class PagedEntityClass {
  offsets: number[] = [];

  hashCode: number = 0;

  // The pages are managed using an array - however random removal is
  // necessary for this to function..
  pages: PagedEntityPage[] = [];

  freePages: PagedEntityPage[] = [];

  constructor(store: PagedEntityStore, offsets: number[]) {
    this.offsets = offsets;
    this.hashCode = getGroupContainerHashCode(offsets, store);
  }

  acquireSlot(store: PagedEntityStore): [PagedEntityPage, number] {

  }

  releaseSlot(
    store: PagedEntityStore,
    page: PagedEntityPage,
  ): void {

  }
}
