import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityClass } from './PagedEntityClass';

import { ComponentContainer, EntityStore } from '../types';

export class PagedEntityStore implements EntityStore {
  entities: (PagedEntity | null)[];

  deletedEntities: PagedEntity[];

  classes: Map<number, PagedEntityClass>;

  components: ComponentContainer<any, any>[];

  componentsMap: Map<string, ComponentContainer<any, any>>;

  constructor() {
    this.entities = [];
    this.deletedEntities = [];
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
    } else {
      entity = new PagedEntity(this, this.entities.length, null, 0);
    }
    // Set the map if it exists
    if (map != null) {
      entity.fromObject(map);
    }
    return entity;
  }

  delete(id: number): void {

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

  unfloat(entity: PagedEntity): void {
    // TODO: This looks odd.
    const signatures = entity.getSignatures();
    const signature = entity.getSignature();
    // Find the target class
    const entityClass = this.getClass(signatures, signature);
    if (entity.parent != null && entity.parent.entityClass === entityClass) {
      // Do nothing and make the entity unlocked.
      entity.parent.locked[entity.offset] = false;
    }
    const [page, offset] = entityClass.acquireSlot();
    entity.move(page, offset);
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
