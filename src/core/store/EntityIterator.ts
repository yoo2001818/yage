import { EntityGroup } from './EntityGroup';
import { Entity } from './EntityInterface';

import { ValueIsComponent } from './types';

export class EntityIterator<D extends ValueIsComponent<D> = any>
implements Entity<D> {
  group: EntityGroup;

  index: number;

  constructor(group: EntityGroup, index: number) {
    this.group = group;
    this.index = index;
  }
}
