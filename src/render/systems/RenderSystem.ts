import { ShaderBuffer } from '../gl/ShaderBuffer';
import { GeometryBuffer } from '../gl/GeometryBuffer';
import { MeshComponent } from '../components/MeshComponent';
import { EntityStore } from '../../store/EntityStore';
import { LocRotScaleIndex } from '../../indexes/LocRotScaleIndex';
import { LocRotScaleComponent } from '../components/LocRotScaleComponent';
import { MaterialComponent } from '../components/MaterialComponent';
import { GeometryComponent } from '../components/GeometryComponent';
import { ShaderComponent } from '../components/ShaderComponent';
import { Shader } from '../Shader';
import { Geometry } from '../Geometry';

export class RenderSystem {
  gl: WebGLRenderingContext;

  shaders: Map<number, ShaderBuffer>;

  geometries: Map<number, GeometryBuffer>;

  entityStore: EntityStore;

  meshComponent: MeshComponent;

  posComponent: LocRotScaleComponent;

  materialComponent: MaterialComponent;

  geometryComponent: GeometryComponent;

  shaderComponent: ShaderComponent;

  locRotScaleIndex: LocRotScaleIndex;

  constructor(store: EntityStore, gl: WebGLRenderingContext) {
    this.gl = gl;
    this.shaders = new Map();
    this.geometries = new Map();
    this.entityStore = store;
    this.meshComponent = store.getComponent<MeshComponent>('mesh');
    this.posComponent = store.getComponent<LocRotScaleComponent>('position');
    this.materialComponent = store.getComponent<MaterialComponent>('material');
    this.geometryComponent = store.getComponent<GeometryComponent>('geometry');
    this.shaderComponent = store.getComponent<ShaderComponent>('shader');
    this.locRotScaleIndex = store.getIndex<LocRotScaleIndex>('locRotScale');
  }

  update(): void {
    const {
      gl,
      entityStore,
      meshComponent,
      posComponent,
      locRotScaleIndex,
    } = this;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable bunch of test
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.FRONT);
    this.entityStore.forEachGroupWith([
      meshComponent,
      posComponent,
    ], (group, meshPos, posPos) => {
      const [materialId, geometryId] = meshComponent.get(meshPos);
      const pos = locRotScaleIndex.getArrayOf(posPos);
      // Prepare geometry and material
      const geometryEnt = entityStore.getEntity(geometryId);
      if (geometryEnt == null) return;
      const geometry = geometryEnt.get(this.geometryComponent);
      if (geometry == null) return;
      const materialEnt = entityStore.getEntity(materialId);
      if (materialEnt == null) return;
      const material = materialEnt.get(this.materialComponent);
      if (material == null) return;
      // Acquire shader
      const shaderEnt = entityStore.getEntity(material.shaderId);
      if (shaderEnt == null) return;
      const shader = shaderEnt.get(this.shaderComponent);
      if (shader == null) return;
      // Acquire shader buffer and use it
      const shaderBuf = this.getShaderBuffer(material.shaderId, shader);
      shaderBuf.bind();
      shaderBuf.setUniforms(material.uniforms);
      // Then, set geometry
      const geometryBuf = this.getGeometryBuffer(geometryId, geometry);
      geometryBuf.bind(shaderBuf);
      // TODO: Set up camera and lights, instancing
      geometryBuf.render();
    });
  }

  getShaderBuffer(id: number, shader: Shader): ShaderBuffer {
    let buffer = this.shaders.get(id);
    if (buffer == null) {
      buffer = new ShaderBuffer(this.gl);
      this.shaders.set(id, buffer);
    }
    buffer.sync(shader);
    return buffer;
  }

  getGeometryBuffer(id: number, geometry: Geometry): GeometryBuffer {
    let buffer = this.geometries.get(id);
    if (buffer == null) {
      buffer = new GeometryBuffer(this.gl);
      this.geometries.set(id, buffer);
    }
    buffer.sync(geometry);
    return buffer;
  }
}
