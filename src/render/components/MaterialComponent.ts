import { MutableComponent } from '../../components/MutableComponent';

import { Material } from '../Material';

export class MaterialComponent extends MutableComponent<Material> {
  constructor() {
    super(() => ({ shaderId: 0, uniforms: {} }));
  }
}
