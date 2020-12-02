import { CameraComponent } from './CameraComponent';
import { GeometryComponent } from './GeometryComponent';
import { LightComponent } from './LightComponent';
import { LocRotScaleComponent } from './LocRotScaleComponent';
import { MaterialComponent } from './MaterialComponent';
import { MeshComponent } from './MeshComponent';
import { ShaderComponent } from './ShaderComponent';

export function createComponents() {
  return {
    camera: new CameraComponent(),
    geometry: new GeometryComponent(),
    light: new LightComponent(),
    pos: new LocRotScaleComponent(),
    material: new MaterialComponent(),
    mesh: new MeshComponent(),
    shader: new ShaderComponent(),
  };
}
