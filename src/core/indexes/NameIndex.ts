import { Component } from '../components/Component';
import { EntityGroup } from '../store/EntityGroup';
import { getGroupComponentOffset } from '../store/EntityGroupMethods';
import { EntityStore } from '../store/EntityStore';
import { Entity } from '../store/Entity';

interface NameIndexEntry {
  group: EntityGroup,
  index: number,
}

export class NameIndex {
  store!: EntityStore;

  nameComponent!: Component<string>;

  names: Map<string, NameIndexEntry[]>;

  constructor() {
    this.names = new Map();
    this._handleRemoved = this._handleRemoved.bind(this);
    this._handleChanged = this._handleChanged.bind(this);
  }

  register(store: EntityStore): void {
    this.names = new Map();
    // Register listeners
    this.store = store;
    this.nameComponent = this.store.getComponent('name');
    this.store.removedSignal.subscribe(this._handleRemoved);
    this.nameComponent.subscribe(this._handleChanged);
  }

  unregister(): void {
    this.names = new Map();
  }

  _handleRemoved(entity: Entity): void {
    const { nameComponent } = this;
    const name = entity.get(nameComponent);
    if (name != null) this.names.set(name, []);
  }

  _handleChanged(group: EntityGroup, start: number, size: number): void {
    // Scan the contents of the entity group and map the name index entries.
    const { nameComponent } = this;
    const offset = getGroupComponentOffset(group, nameComponent);
    if (offset === -1) return;
    for (let i = 0; i < size; i += 1) {
      const name = nameComponent.get(offset + start + i);
      const entry = { group, index: start + i };
      this.names.set(name, [entry]);
    }
  }

  get(name: string): Entity | null {
    const entries = this.names.get(name);
    if (entries == null || entries.length === 0) return null;
    const entry = entries[0];
    const entity = new Entity(this.store, entry.group, entry.index);
    return entity;
  }
}
