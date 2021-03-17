import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityStore } from './SimpleEntityStore';

import { EntityPage } from '../types';

export class SimpleEntityPage implements EntityPage {
  entities: SimpleEntity[];

  store: SimpleEntityStore;

  constructor(store: SimpleEntityStore, entities: SimpleEntity[]) {
    this.entities = entities;
    this.store = store;
  }

  getEntities(): SimpleEntity[] {
    return this.entities;
  }

  forEach(callback: (entity: SimpleEntity) => void): void {
    this.entities.forEach(callback);
  }

  emit(name: string): void {
    this.store.getSignal(name).emit(this);
  }
}
