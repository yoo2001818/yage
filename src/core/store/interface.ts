import { Signal } from '../Signal';

export interface EntityStore {
  // Entity manipulation
  get(id: number): Entity | null;
  create(): Entity;
  remove(id: number): void;
  forEach(callback: (entity: Entity) => void): void;
  query(): EntityQuery;

  // Signals. It can emit a bundle of entities..
  getSignal(name: string): Signal<[EntityPage]>,

  toJSON(): unknown;
  fromJSON(value: unknown): void;
}

export interface Entity {
  id: number;

  has(name: string): boolean;
  get<V>(name: string): V;
  set<V>(name: string, value: V): void;
  remove(name: string): void;

  emit(name: string): void;

  toJSON(): unknown;
  fromJSON(value: unknown): void;
}

export interface EntityPage {
  getEntities(): Entity[];

  emit(name: string): void;
}

export interface EntityQuery {
  withComponents(...name: string[]): void;

  forEach(callback: (entity: Entity) => void): void;
  forEachPage(callback: (page: EntityPage) => void): void;
}
