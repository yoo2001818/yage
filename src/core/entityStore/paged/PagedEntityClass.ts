import { getGroupContainerHashCode } from './utils';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityStore } from './PagedEntityStore';
import { PagedEntity } from './PagedEntity';

export class PagedEntityClass {
  signature: number[] = [];

  hashCode: number = 0;

  // The pages are managed using an array - however random removal is
  // necessary for this to function..
  pages: PagedEntityPage[] = [];

  freePages: PagedEntityPage[] = [];

  constructor(store: PagedEntityStore, signature: number[]) {
    this.signature = signature;
    this.hashCode = getGroupContainerHashCode(signature, store);
  }

  _initPage(
    store: PagedEntityStore,
    page: PagedEntityPage,
  ): void {
    // Fill the page with its own signature
  }

  acquireSlot(store: PagedEntityStore): [PagedEntityPage, number] {
    if (this.freePages.length > 0) {
      const page = this.freePages[this.freePages.length - 1];
      if (page.size + 1 >= page.maxSize) {
        this.freePages.pop();
      }
      return [page, page.acquireSlot()];
    }
    const page = new PagedEntityPage(store, this.signature, 32);
    this._initPage(store, page);
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
    if (page.size === page.maxSize) {
      this.freePages.push(page);
    }
    page.releaseSlot(index);
    if (page.size === 0) {
      // Remove the page
    }
  }
}
