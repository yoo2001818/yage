import { Float32ArrayComponent } from '../components/Float32ArrayComponent';
import { EntityGroup } from '../EntityGroup';
import { getGroupComponentOffset } from '../EntityGroupMethods';
import { EntityStore } from '../EntityStore';
import { Entity } from '../Entity';

export class LocRotScaleIndex {
  store!: EntityStore;

  name: string;

  component!: Float32ArrayComponent;

  arrays: Float32Array[];

  constructor(name: string) {
    this.arrays = [];
    this.name = name;
    this._handleChanged = this._handleChanged.bind(this);
  }

  register(store: EntityStore): void {
    this.arrays = [];
    // Register listeners
    this.store = store;
    this.component = store.getComponent<Float32ArrayComponent>(this.name);
    this.component.subscribe(this._handleChanged);
  }

  unregister(): void {
    this.arrays = [];
  }

  _handleChanged(group: EntityGroup, start: number, size: number): void {
    // Scan the changed data and recalculate LocRotScale.
    // The array must be properly aligned to Float32ArrayComponent! Hmm...
    const { component } = this;
    const offset = getGroupComponentOffset(group, component);
    if (offset === -1) return;
    for (let i = 0; i < size; i += 1) {
    }
  }
}
