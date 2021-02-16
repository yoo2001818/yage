import { ComponentFromJSON } from './Component';
import { ImmutableComponent } from './ImmutableComponent';

export interface ImmutableClassComponentChild {
  toJSON(mapId?: (id: number | null) => unknown): unknown,
}

export interface ImmutableClassComponentChildConstructor<
  T extends ImmutableClassComponentChild> {
  new(): T,
  fromJSON: ComponentFromJSON<T>,
}

export class ImmutableClassComponent<T extends ImmutableClassComponentChild>
  extends ImmutableComponent<T> {
  constructor(constructor: ImmutableClassComponentChildConstructor<T>) {
    super(
      constructor.fromJSON,
      (item, mapId) => item.toJSON(mapId),
    );
  }
}
