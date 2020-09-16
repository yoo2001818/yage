import { EntityStore } from '../EntityStore';

export interface Index {
  register(entityStore: EntityStore): void;
  unregister(): void;
}
