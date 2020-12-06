import { ImmutableComponent } from '../../components/ImmutableComponent';
import { Camera } from '../Camera';
import { Geometry } from '../Geometry';
import { Light } from '../Light';
import { Material } from '../Material';
import { Shader } from '../Shader';
import { TransformComponent } from './TransformComponent';
import { MeshComponent } from './MeshComponent';
import { Texture } from '../Texture';

export function createComponents() {
  return {
    camera: new ImmutableComponent<Camera>(),
    geometry: new ImmutableComponent<Geometry>(),
    light: new ImmutableComponent<Light>(),
    transform: new TransformComponent(),
    material: new ImmutableComponent<Material>(),
    mesh: new MeshComponent(),
    shader: new ImmutableComponent<Shader>(),
    texture: new ImmutableComponent<Texture>(),
  };
}
