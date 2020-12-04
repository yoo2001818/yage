import { ImmutableComponent } from '../../components/ImmutableComponent';
import { Camera } from '../Camera';
import { Geometry } from '../Geometry';
import { Light } from '../Light';
import { Material } from '../Material';
import { Shader } from '../Shader';
import { LocRotScaleComponent } from './LocRotScaleComponent';
import { MeshComponent } from './MeshComponent';

export function createComponents() {
  return {
    camera: new ImmutableComponent<Camera>(),
    geometry: new ImmutableComponent<Geometry>(),
    light: new ImmutableComponent<Light>(),
    pos: new LocRotScaleComponent(),
    material: new ImmutableComponent<Material>(),
    mesh: new MeshComponent(),
    shader: new ImmutableComponent<Shader>(),
  };
}
