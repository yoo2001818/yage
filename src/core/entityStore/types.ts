export interface EntityStore {
  // Entity manipulation
  get(id: number): Entity | null;
  create(): Entity;
  createFrom(object: { [key: string]: unknown }): Entity;
  delete(id: number): void;
  forEach(callback: (entity: Entity) => void): void;
  forEachPage(callback: (page: EntityPage) => void): void;
  query(): EntityQuery;

  // Component manipulation
  addComponent(name: string, componentContainer: ComponentContainer): void;
}

export interface Entity {
  id: number;

  has(name: string): boolean;
  get<V>(name: string): V;
  set<V>(name: string, value: V): void;
  delete(name: string): void;

  toObject(): { [key: string]: unknown };
  fromObject(value: { [key: string]: unknown }): void;
}

export interface EntityPage {
  getEntities(): Entity[];
  forEach(callback: (entity: Entity) => void): void;
}

export interface EntityQuery {
  withComponents(...name: string[]): void;

  forEach(callback: (entity: Entity) => void): void;
  forEachPage(callback: (page: EntityPage) => void): void;
}

export interface ComponentContainer<T = unknown> {
  get(entity: Entity): T,
  set(entity: Entity, value: T): void,

  getSignature(entity: Entity): number,
}
