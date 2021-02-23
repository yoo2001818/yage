import { EntityStore } from './EntityStore';
import { ValueIsComponent } from './types';

export class EntityHandle<D extends ValueIsComponent<D> = any> {
  store: EntityStore<D>;

  id: number;

  constructor(store: EntityStore<D>, id: number) {
    this.store = store;
    this.id = id;
  }
}
