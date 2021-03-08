import { Component } from '../components/Component';
import { EntityPage } from '../store/EntityPage';
import { getGroupComponentOffset } from '../store/EntityGroupMethods';
import { EntityStore } from '../store/EntityStore';
import { Entity, GroupEntity } from '../store/entity';

interface IdIndexEntry {
  group: EntityPage,
  index: number,
}

export class IdIndex {
  store!: EntityStore;

  idComponent!: Component<number>;

  ids: (IdIndexEntry | null)[];

  constructor() {
    this.ids = [];
    this._handleRemoved = this._handleRemoved.bind(this);
    this._handleChanged = this._handleChanged.bind(this);
  }

  register(store: EntityStore): void {
    this.ids = [];
    // Register listeners
    this.store = store;
    this.idComponent = this.store.idComponent;
    this.store.removedSignal.subscribe(this._handleRemoved);
    this.store.idComponent.subscribe(this._handleChanged);
  }

  unregister(): void {
    this.ids = [];
  }

  _handleRemoved(entity: Entity): void {
    const { idComponent } = this;
    const id = entity.get(idComponent);
    if (id != null) this.ids[id] = null;
  }

  _handleChanged(group: EntityPage, start: number, size: number): void {
    // Scan the contents of the entity group and map the id index entries.
    const { idComponent } = this;
    const offset = getGroupComponentOffset(group, idComponent);
    if (offset === -1) return;
    for (let i = 0; i < size; i += 1) {
      const id = idComponent.get(offset + start + i);
      this.ids[id] = { group, index: start + i };
    }
  }

  get(id: number): Entity | null {
    const entry = this.ids[id];
    if (entry == null) return null;
    const entity = new GroupEntity(this.store, entry.group, entry.index);
    return entity;
  }
}
