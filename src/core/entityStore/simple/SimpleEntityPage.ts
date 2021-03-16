import { SimpleEntity } from './SimpleEntity';
import { SimpleEntityStore } from './SimpleEntityStore';

import { EntityPage } from '../types';

export class SimpleEntityPage implements EntityPage {
  entities: SimpleEntity[];

  store: SimpleEntityStore;

  constructor(entities: SimpleEntity[]) {
    this.entities = entities;
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
