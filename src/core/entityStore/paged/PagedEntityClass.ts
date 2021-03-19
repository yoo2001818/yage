import { PagedEntityPage } from './PagedEntityPage';

export class PagedEntityClass {
  id: number;

  offsets: number[] = [];

  hashCode: number = 0;

  pages: PagedEntityPage[] = [];

  constructor() {

  }
}
