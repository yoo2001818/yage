import {
  ComponentContainer,
  Entity,
  EntityPage,
  EntityStore,
} from '../types';

type PagedComponentEntry<T> =
| { deleted: true, value: undefined }
| { deleted: false, value: T };

export class PagedComponentContainer<T> implements ComponentContainer<T, T> {
  id!: number;

  name!: string;

  store!: EntityStore;

  register(store: EntityStore, id: number, name: string): void {
    this.id = id;
    this.name = name;
    this.store = store;
  }

  has(entity: Entity): boolean {
    const entry = entity.componentData[this.id] as PagedComponentEntry<T>;
    if (entry != null) {
      // If it's explicitly marked to be deleted, it's deleted
      return !entry.deleted;
    }
    // Then, check for the parent
    const { parent } = entity;
    if (parent == null) return false;
    return parent.componentData[this.id] !== undefined;
  }

  get(entity: Entity): T | undefined {
    const entry = entity.componentData[this.id] as PagedComponentEntry<T>;
    if (entry != null) {
      if (!entry.deleted) return entry.value;
      return undefined;
    }
    // Then, check for the parent
    const { parent } = entity;
    if (parent == null) return undefined;
    const parentArr = parent.componentData[this.id] as T[];
    if (parentArr == null) return undefined;
    return parentArr[entity.offset];
  }

  set(entity: Entity, value: T): void {
    // The entity can be in "standalone" or "paged" mode. In either case,
    // the entity can store data on its own (for now).
    const { parent } = entity;
    if (parent == null) {
      const entry: PagedComponentEntry<T> = {
        deleted: false,
        value,
      };
      entity.componentData[this.id] = entry;
      return;
    }
    const parentArr = parent.componentData[this.id] as T[];
    if (parentArr == null) {
      const entry: PagedComponentEntry<T> = {
        deleted: false,
        value,
      };
      entity.componentData[this.id] = entry;
      return;
    }
    entity.componentData[this.id] = undefined;
    parentArr[entity.offset] = value;
  }

  delete(entity: Entity): void {
    // If the parent array is already undefined, there's no need to set
    // entry to this.
    // We can think this in layers -
    // - Independent entity, which always defaults to layer 1
    // - Dependent entity, which tries to read layer 1 and fall back to layer 2
    //   otherwise
    // The same principle applies on set and deletion too.
    const { parent } = entity;
    if (parent == null) {
      const entry: PagedComponentEntry<T> = {
        deleted: true,
        value: undefined,
      };
      entity.componentData[this.id] = entry;
      return;
    }
    const parentArr = parent.componentData[this.id] as T[];
    if (parentArr == null) return;
    const entry: PagedComponentEntry<T> = {
      deleted: true,
      value: undefined,
    };
    entity.componentData[this.id] = entry;
  }

  move(entity: Entity, destPage: EntityPage | null, destOffset: number): void {
    // Retrieve the data from entity and set it.
    // NOTE if we have destPage set, it assumes that destPage has parentArr.
    const value = this.get(entity) as T;
    // If the value is undefined, it means it has been deleted; there's no
    // need to do anything else.
    if (value === undefined) return;
    if (destPage != null) {
      const parentArr = destPage.componentData[this.id] as T[];
      parentArr[destOffset] = value;
      entity.componentData[this.id] = undefined;
    } else {
      entity.componentData[this.id] = { deleted: false, value };
    }
  }

  initPage(page: EntityPage): void {
    page.componentData[this.id] = [];
  }

  finalizePage(): void {
    // noop
  }

  getSignature(entity: Entity): number {
    return this.has(entity) ? 1 : 0;
  }
}
