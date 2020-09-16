import { EntityGroup } from 'src/EntityGroup';
import { EntityStore } from '../EntityStore';

interface IdIndexEntry {
  group: EntityGroup,
  index: number,
}

export class IdIndex {
  ids: IdIndexEntry[];

  constructor() {
    this.ids = [];
  }

  register(entityStore: EntityStore): void {
    this.ids = [];
    // Register listeners
  }

  unregister(): void {
    this.ids = [];
  }
}
