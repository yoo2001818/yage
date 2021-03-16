import { SimpleEntity } from './SimpleEntity';

import { EntityPage } from '../types';

export class SimpleEntityPage implements EntityPage {
  entities: SimpleEntity[];

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
    // noop
  }
}
