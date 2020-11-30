import { MutableComponent } from '../../components/MutableComponent';

import { Geometry } from '../Geometry';

export class GeometryComponent extends MutableComponent<Geometry> {
  constructor() {
    super(() => new Geometry());
  }
}
