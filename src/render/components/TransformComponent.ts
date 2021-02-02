import { Float32ArrayComponent } from '../../core';
import { Transform } from '../indexes/Transform';

export class TransformComponent extends Float32ArrayComponent<Transform> {
  constructor() {
    super(
      12,
      (v) => new Transform(v),
      (v) => v.rawArray,
    );
  }
}
