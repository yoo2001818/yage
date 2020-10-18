import { Component } from '../components/Component';
import { EntityGroup } from '../EntityGroup';
import { getGroupComponentOffset } from '../EntityGroupMethods';
import { EntityStore } from '../EntityStore';
import { Entity } from '../Entity';

interface IdIndexEntry {
  group: EntityGroup,
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
    // this.store.removedSignal.subscribe(this._handleRemoved);
    // this.store.idComponent.subscribe(this._handleChanged);
  }

  unregister(): void {
    this.ids = [];
  }

  _handleRemoved(entity: Entity): void {
    const { idComponent } = this;
    const id = entity.get(idComponent);
    if (id != null) this.ids[id] = null;
  }

  _handleChanged(group: EntityGroup): void {
    // Scan the contents of the entity group and map the id index entries.
    const { idComponent } = this;
    const offset = getGroupComponentOffset(group, idComponent);
    if (offset === -1) return;
    for (let i = 0; i < group.size; i += 1) {
      const id = idComponent.get(offset + i);
      this.ids[id] = { group, index: i };
    }
  }

  get(id: number): Entity | null {
    const entry = this.ids[id];
    if (entry == null) return null;
    const entity = new Entity(this.store, entry.group, entry.index);
    return entity;
  }
}
