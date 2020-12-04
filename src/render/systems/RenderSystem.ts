import { mat4 } from 'gl-matrix';
import { ShaderBuffer } from '../gl/ShaderBuffer';
import { GeometryBuffer } from '../gl/GeometryBuffer';
import { MeshComponent } from '../components/MeshComponent';
import { EntityStore } from '../../store/EntityStore';
import { Entity } from '../../store/Entity';
import { LocRotScaleIndex } from '../../indexes/LocRotScaleIndex';
import { TransformComponent } from '../components/TransformComponent';
import { Shader } from '../Shader';
import { Geometry } from '../Geometry';
import { Camera } from '../Camera';
import { Component } from '../../components/Component';
import { Material } from '../Material';

export class RenderSystem {
  gl: WebGLRenderingContext;

  instancedExt: ANGLE_instanced_arrays;

  shaders: Map<number, ShaderBuffer>;

  geometries: Map<number, GeometryBuffer>;

  entityStore: EntityStore;

  meshComponent: MeshComponent;

  transformComponent: TransformComponent;

  materialComponent: Component<Material>;

  geometryComponent: Component<Geometry>;

  shaderComponent: Component<Shader>;

  locRotScaleIndex: LocRotScaleIndex;

  instancedGeom: Geometry;

  cameraId: number | null;

  constructor(store: EntityStore, gl: WebGLRenderingContext) {
    this.gl = gl;
    this.instancedExt = gl.getExtension('ANGLE_instanced_arrays')!;
    this.shaders = new Map();
    this.geometries = new Map();
    this.entityStore = store;
    this.meshComponent = store.getComponent<MeshComponent>('mesh');
    this.transformComponent = store
      .getComponent<TransformComponent>('transform');
    this.materialComponent = store
      .getComponent<Component<Material>>('material');
    this.geometryComponent = store
      .getComponent<Component<Geometry>>('geometry');
    this.shaderComponent = store.getComponent<Component<Shader>>('shader');
    this.locRotScaleIndex = store.getIndex<LocRotScaleIndex>('locRotScale');
    this.instancedGeom = new Geometry();
    this.cameraId = null;
  }

  setCamera(entity: Entity): void {
    this.cameraId = entity.get<number>('id');
  }

  getViewMatrix(): Float32Array {
    const {
      cameraId,
      transformComponent,
      locRotScaleIndex,
    } = this;
    const output = mat4.create() as Float32Array;
    if (cameraId == null) return output;
    const entity = this.entityStore.getEntity(cameraId);
    if (entity == null) return output;
    const transform = locRotScaleIndex.get(entity.getPos(transformComponent));
    mat4.invert(output, transform);
    return output;
  }

  getProjectionMatrix(): Float32Array {
    const { cameraId } = this;
    const output = mat4.create() as Float32Array;
    if (cameraId == null) return output;
    const entity = this.entityStore.getEntity(cameraId);
    if (entity == null) return output;
    const camera = entity.get<Camera>('camera');
    if (camera == null) return output;
    switch (camera.type) {
      case 'orthgonal':
        mat4.ortho(output, -1, 1, -1, 1, camera.near, camera.far);
        break;
      case 'perspective':
        mat4.perspective(output, camera.fov, 640 / 480, camera.near, camera.far);
        break;
      default:
    }
    return output;
  }

  update(): void {
    const {
      gl,
      entityStore,
      meshComponent,
      transformComponent,
      locRotScaleIndex,
    } = this;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable bunch of test
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.BACK);
    const uView = this.getViewMatrix();
    const uProjection = this.getProjectionMatrix();
    this.entityStore.forEachGroupWith([
      meshComponent,
      transformComponent,
    ], (group, meshPos, transformPos) => {
      const { materialId, geometryId } = meshComponent.get(meshPos);
      const transform = locRotScaleIndex.getArrayOf(transformPos);
      // Prepare geometry and material
      const geometry = entityStore
        .getComponentOfEntity(geometryId, this.geometryComponent);
      const material = entityStore
        .getComponentOfEntity(materialId, this.materialComponent);
      const shader = entityStore
        .getComponentOfEntity(material.shaderId, this.shaderComponent);
      // Acquire shader buffer and use it
      const shaderBuf = this.getShaderBuffer(material.shaderId, shader);
      shaderBuf.bind();
      shaderBuf.setUniforms(material.uniforms);
      // Then, set geometry
      const geometryBuf = this.getGeometryBuffer(geometryId, geometry);
      geometryBuf.bind(shaderBuf);
      // TODO: Set up camera and lights, instancing.
      shaderBuf.setUniforms({
        uView,
        uProjection,
      });
      // Set instanced geometry (if supported)
      if (shaderBuf.attributes.has('aModel')) {
        // TODO: Really?
        this.instancedGeom.setAttribute('aModel', {
          data: transform.subarray(0, group.size * 16),
          axis: 16,
        });
        const instancedBuf = this.getGeometryBuffer(
          9999999,
          this.instancedGeom,
        );
        const primCount = instancedBuf.bind(shaderBuf, 1);
        geometryBuf.render(primCount);
      } else {
        // The shader doesn't support instancing, fall back to regular routine
        for (let i = 0; i < group.size; i += 1) {
          shaderBuf.setUniforms({
            uModel: transform.subarray(i * 16, i * 16 + 16),
          });
          geometryBuf.render();
        }
      }
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
      buffer = new GeometryBuffer(this.gl, this.instancedExt);
      this.geometries.set(id, buffer);
    }
    buffer.sync(geometry);
    return buffer;
  }
}
