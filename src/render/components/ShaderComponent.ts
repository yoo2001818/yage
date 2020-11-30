import { MutableComponent } from '../../components/MutableComponent';

import { Shader } from '../Shader';

export class ShaderComponent extends MutableComponent<Shader> {
  constructor() {
    super(() => new Shader('', ''));
  }
}
