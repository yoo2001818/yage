import { PagedEntity } from './PagedEntity';
import { PagedEntityQuery } from './PagedEntityQuery';
import { PagedEntityPage } from './PagedEntityPage';
import { PagedEntityClass } from './PagedEntityClass';

import { ComponentContainer, EntityStore } from '../types';

export class PagedEntityStore implements EntityStore {
  entities: (PagedEntity | null)[];

  classes: Map<number, PagedEntityClass>;

  components: ComponentContainer<any, any>[];

  componentsMap: Map<string, ComponentContainer<any, any>>;

  constructor() {
    this.entities = [];
    this.classes = new Map();
    this.components = [];
    this.componentsMap = new Map();
  }

  get(id: number): PagedEntity | null {
    return this.entities[id];
  }

  create(map?: Record<string, unknown>): PagedEntity {

  }

  delete(id: number): void {

  }

  forEach(callback: (entity: PagedEntity) => void): void {

  }

  forEachPage(callback: (page: PagedEntityPage) => void): void {

  }
  
  query(): PagedEntityQuery {
    return new PagedEntityQuery(this);
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
