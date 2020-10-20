import { mat4 } from 'gl-matrix';
import { Float32ArrayComponent } from '../components/Float32ArrayComponent';
import { EntityGroup } from '../EntityGroup';
import { getGroupComponentOffset } from '../EntityGroupMethods';
import { EntityStore } from '../EntityStore';
import { Entity } from '../Entity';

const PAGE_SIZE = 65536;

export class LocRotScaleIndex {
  store!: EntityStore;

  name: string;

  arrays: Float32Array[];

  component!: Float32ArrayComponent;

  constructor(name: string) {
    this.name = name;
    this.arrays = [];
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

  getPage(page: number): Float32Array {
    if (this.arrays.length > page) {
      return this.arrays[page];
    }
    const array = new Float32Array(PAGE_SIZE * 16);
    this.arrays.push(array);
    return array;
  }

  get(pos: number): Float32Array {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * 16;
    const array = this.getPage(page);
    return array.subarray(offset, offset + 16);
  }

  getArrayOf(pos: number): Float32Array {
    const page = pos / PAGE_SIZE | 0;
    const offset = (pos % PAGE_SIZE) * 16;
    const array = this.getPage(page);
    return array.subarray(offset);
  }

  _handleChanged(group: EntityGroup, start: number, size: number): void {
    // TODO Do we really have to recalculate everything at here?
    // Scan the changed data and recalculate LocRotScale.
    // The array must be properly aligned to Float32ArrayComponent! Hmm...
    const { component } = this;
    const offset = getGroupComponentOffset(group, component);
    if (offset === -1) return;
    const origin = component.getArrayOf(offset);
    const target = this.getArrayOf(offset);
    // The origin array should be the following:
    // 1) translation: x, y, z, 0
    // 2) quaternion: a, b, c, d
    // 3) scale: x, y, z, 0
    // So, the origin is expected to have 3 vec4s.
    for (let i = start; i < start + size; i += 1) {
      mat4.fromRotationTranslationScale(
        target.subarray(i * 16, i * 16 + 16),
        origin.subarray(i * 12 + 4, i * 12 + 8),
        origin.subarray(i * 12, i * 12 + 3),
        origin.subarray(i * 12 + 8, i * 12 + 12),
      );
    }
  }
}
