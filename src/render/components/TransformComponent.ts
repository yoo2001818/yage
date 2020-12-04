import { Float32ArrayComponent } from '../../components/Float32ArrayComponent';
import { Transform } from '../Transform';

export class TransformComponent extends Float32ArrayComponent<Transform> {
  constructor() {
    super(
      12,
      (v) => new Transform(v),
      (v) => v.rawArray,
    );
  }
}
