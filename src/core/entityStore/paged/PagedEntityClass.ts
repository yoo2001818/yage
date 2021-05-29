import { PagedEntity } from './PagedEntity';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityStore } from './PagedEntityStore';

export class PagedEntityClass {
  store: PagedEntityStore;

  signatures: number[] = [];

  signature: number = 0;

  // The pages are managed using an array - however random removal is
  // necessary for this to function..
  pages: PagedEntityPage[] = [];

  freePages: PagedEntityPage[] = [];

  constructor(
    store: PagedEntityStore,
    signatures: number[],
    signature: number,
  ) {
    this.store = store;
    this.signatures = signatures;
    this.signature = signature;
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
    this.pages.forEach(callback);
  }

  _createPage(): PagedEntityPage {
    // Fill the page with its own signature
    const page = new PagedEntityPage(this.store, this, 32);
    for (const component of this.store.getComponents()) {
      component.initPage(page);
    }
    this.pages.push(page);
    this.freePages.push(page);
    return page;
  }

  acquireSlot(entity: PagedEntity): [PagedEntityPage, number] {
    if (this.freePages.length > 0) {
      const page = this.freePages[this.freePages.length - 1];
      if (page.size + 1 >= page.maxSize) {
        this.freePages.pop();
      }
      return [page, page.acquireSlot(entity)];
    }
    const page = this._createPage();
    return [page, page.acquireSlot(entity)];
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
