import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityClass } from './PagedEntityClass';

import { ComponentContainer, EntityStore } from '../types';

export class PagedEntityStore implements EntityStore {
  entities: (PagedEntity | null)[];

  deletedEntities: PagedEntity[];

  floatingEntities: PagedEntity[];

  classes: Map<number, PagedEntityClass>;

  components: ComponentContainer<any, any>[];

  componentsMap: Map<string, ComponentContainer<any, any>>;

  constructor() {
    this.entities = [];
    this.deletedEntities = [];
    this.floatingEntities = [];
    this.classes = new Map();
    this.components = [];
    this.componentsMap = new Map();
  }

  get(id: number): PagedEntity | null {
    return this.entities[id];
  }

  create(map?: Record<string, unknown>): PagedEntity {
    let entity: PagedEntity;
    const revivedEntity = this.deletedEntities.pop();
    if (revivedEntity != null) {
      entity = revivedEntity;
      this.entities[entity.id] = entity;
    } else {
      entity = new PagedEntity(this, this.entities.length, null, 0);
      this.entities.push(entity);
    }
    // Set the map if it exists
    if (map != null) {
      entity.fromObject(map);
    }
    // TODO Make it floating, or not floating. If the entity is a floating
    // entity, register to floating entity page.
    // Otherwise, find and assign entity.
    this.floatingEntities.push(entity);
    return entity;
  }

  delete(id: number): void {
    // Make the entity floating, then remove it from the page
    // TODO How am I going to implement it? the page doesn't maintain
    // entities...
    const entity = this.get(id);
    if (entity == null) return;
    entity.floating = true;
    this.entities[id] = null;
  }

  forEach(callback: (entity: PagedEntity) => void): void {
    this.entities.forEach((entity) => {
      if (entity != null) callback(entity);
    });
  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {
    this.classes.forEach((entityClass) => {
      entityClass.forEachPage(callback);
    });
  }

  query(): PagedEntityQuery {
    return new PagedEntityQuery(this);
  }

  float(entity: PagedEntity): void {
    // Mark the entity as floating.
    if (!entity.floating) {
      entity.floating = true;
      this.floatingEntities.push(entity);
    }
  }

  unfloat(entity: PagedEntity): void {
    // TODO: This looks odd.
    const signatures = entity.getSignatures();
    const signature = entity.getSignature();
    // Find the target class
    const entityClass = this.getClass(signatures, signature);
    const [page, offset] = entityClass.acquireSlot();
    entity.move(page, offset);
    entity.floating = false;
    // TODO: Really?
    this.floatingEntities = this.floatingEntities.filter((v) => v !== entity);
  }

  getClass(signatureArray: number[], signature: number): PagedEntityClass {
    let entityClass = this.classes.get(signature);
    if (entityClass != null) return entityClass;
    entityClass = new PagedEntityClass(this, signatureArray, signature);
    this.classes.set(signature, entityClass);
    return entityClass;
  }

  addComponent(
    name: string,
    componentContainer: ComponentContainer<any, any>,
  ): void {
    if (this.componentsMap.has(name)) {
      throw new Error(`Already registered component ${name}`);
    }
    const id = this.components.length;
    componentContainer.register(this, id, name);
    this.components.push(componentContainer);
    this.componentsMap.set(name, componentContainer);
  }

  addComponents(
    components: Record<string, ComponentContainer<any, any>>,
  ): void {
    for (const [name, value] of Object.entries(components)) {
      this.addComponent(name, value);
    }
  }

  getComponent<T extends ComponentContainer<any, any>>(name: string): T {
    const component = this.componentsMap.get(name);
    if (component == null) {
      throw new Error(`Unknown component ${name}`);
    }
    return component as T;
  }

  getComponents(): ComponentContainer<any, any>[] {
    return this.components;
  }
}
