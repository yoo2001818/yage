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
    if (this.freePages.length > 0) {
      const page = this.freePages[this.freePages.length - 1];
      if (page.size + 1 >= page.maxSize) {
        this.freePages.pop();
      }
      return [page, page.acquireSlot()];
    }
    const page = store.createPage();
    // page.maxSize = ...
    // allocate
    this.pages.push(page);
    this.freePages.push(page);

    return [page, page.acquireSlot()];
  }

  releaseSlot(
    store: PagedEntityStore,
    page: PagedEntityPage,
    index: number,
  ): void {

  }
}
