import { EntityStore } from '../store/EntityStore';

export interface Index {
  register(entityStore: EntityStore): void;
  unregister(): void;
}
