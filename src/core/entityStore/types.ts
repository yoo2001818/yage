export interface EntityStore {
  // Entity manipulation
  get(id: number): Entity | null;
  create(object?: Record<string, unknown>): Entity;
  delete(id: number): void;
  forEach(callback: (entity: Entity) => void): void;
  forEachPage(callback: (page: EntityPage) => void): void;
  query(): EntityQuery;

  // Component manipulation
  addComponent(
    name: string,
    componentContainer: ComponentContainer<any, any>,
  ): void;
  addComponents(components: Record<string, ComponentContainer<any, any>>): void;
  getComponent<T extends ComponentContainer<any, any>>(name: string): T;
  getComponents(): ComponentContainer<any, any>[];
}

export interface Entity {
  id: number;

  parent: EntityPage | null;
  offset: number;

  has(name: string | ComponentContainer<any, any>): boolean;
  get<O>(name: string | ComponentContainer<any, O>): O | undefined,
  set<I>(name: string | ComponentContainer<I, any>, value: I): void;
  delete(name: string | ComponentContainer<any, any>): void;
  clear(): void;

  toObject(): Record<string, unknown>;
  fromObject(value: Record<string, unknown>): void;

  getSignature(): number;

  // The entity must provide free-to-use array to store component's data.
  componentData: unknown[];
}

export interface EntityPage {
  entities: Entity[];

  getEntities(): Entity[];
  forEach(callback: (entity: Entity) => void): void;

  // The entity page must provide free-to-use array to store component's data.
  componentData: unknown[];
}

export interface EntityQuery {
  withComponents(...name: string[]): void;

  forEach(callback: (entity: Entity) => void): void;
  forEachPage(callback: (page: EntityPage) => void): void;
}

// Basically ComponentContainer acts as an converter
export interface ComponentContainer<InType, OutType> {
  id: number;
  name: string;

  register(store: EntityStore, id: number, name: string): void;

  has(entity: Entity): boolean;
  get(entity: Entity): OutType | undefined;
  set(entity: Entity, value: InType): void;
  delete(entity: Entity): void;

  move(entity: Entity, destPage: EntityPage | null, destOffset: number): void;

  initPage(entityPage: EntityPage): void;
  finalizePage(entityPage: EntityPage): void;
  getPage?(entityPage: EntityPage): OutType[];

  getSignature(entity: Entity): number;
}
