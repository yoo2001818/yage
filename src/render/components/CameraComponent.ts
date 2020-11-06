import { MutableComponent } from '../../components/MutableComponent';

import { Camera } from '../Camera';

export class CameraComponent extends MutableComponent<Camera> {
  constructor() {
    super(() => ({
      type: 'perspective',
      far: 1000,
      near: 0.1,
      fov: 90 / 180 * Math.PI,
    }));
  }
}
