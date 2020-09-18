import { EntityGroup } from 'src/EntityGroup';
import { EntityStore } from '../EntityStore';

interface IdIndexEntry {
  group: EntityGroup,
  index: number,
}

export class IdIndex {
  store: EntityStore;
  
  ids: IdIndexEntry[];

  constructor() {
    this.ids = [];
  }

  register(entityStore: EntityStore): void {
    this.ids = [];
    // Register listeners
    this.store = entityStore;
  }

  unregister(): void {
    this.ids = [];
  }
}
