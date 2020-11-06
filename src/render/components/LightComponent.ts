import { MutableComponent } from '../../components/MutableComponent';

import { Light } from '../Light';

export class LightComponent extends MutableComponent<Light> {
  constructor() {
    super(() => ({}));
  }
}
