import { mat4 } from 'gl-matrix';
import { ShaderBuffer } from '../gl/ShaderBuffer';
import { GeometryBuffer } from '../gl/GeometryBuffer';
import { MeshComponent } from '../components/MeshComponent';
import { EntityStore } from '../../store/EntityStore';
import { Entity } from '../../store/Entity';
import { TransformIndex } from '../../indexes/TransformIndex';
import { TransformComponent } from '../components/TransformComponent';
import { Shader } from '../Shader';
import { Geometry } from '../Geometry';
import { Camera } from '../Camera';
import { Component } from '../../components/Component';
import { Material } from '../Material';
import { TextureBuffer } from '../gl/TextureBuffer';
import { Texture } from '../Texture';
import { LowShader } from '../LowShader';
import { Pipeline } from '../pipelines/Pipeline';
import { ForwardPipeline } from '../pipelines/ForwardPipeline';

export class RenderSystem {
  gl: WebGLRenderingContext;

  instancedExt: ANGLE_instanced_arrays;

  lowShaders: Map<number, ShaderBuffer>;

  geometries: Map<number, GeometryBuffer>;

  textures: Map<number, TextureBuffer>;

  boundTextures: TextureBuffer[];

  entityStore: EntityStore;

  meshComponent: MeshComponent;

  transformComponent: TransformComponent;

  materialComponent: Component<Material>;

  geometryComponent: Component<Geometry>;

  shaderComponent: Component<Shader>;

  textureComponent: Component<Texture>;

  transformIndex: TransformIndex;

  pipeline: Pipeline | null = null;

  cameraId: number | null;

  constructor(
    store: EntityStore,
    gl: WebGLRenderingContext,
    pipeline: Pipeline = new ForwardPipeline(),
  ) {
    this.gl = gl;
    this.instancedExt = gl.getExtension('ANGLE_instanced_arrays')!;
    this.lowShaders = new Map();
    this.geometries = new Map();
    this.textures = new Map();
    this.boundTextures = [];
    this.entityStore = store;
    this.meshComponent = store.getComponent<MeshComponent>('mesh');
    this.transformComponent = store
      .getComponent<TransformComponent>('transform');
    this.materialComponent = store
      .getComponent<Component<Material>>('material');
    this.geometryComponent = store
      .getComponent<Component<Geometry>>('geometry');
    this.shaderComponent = store.getComponent<Component<Shader>>('shader');
    this.textureComponent = store
      .getComponent<Component<Texture>>('texture');
    this.transformIndex = store.getIndex<TransformIndex>('transform');
    this.cameraId = null;
    this.setPipeline(pipeline);
  }

  setPipeline(pipeline: Pipeline): void {
    if (this.pipeline != null) {
      this.pipeline.unregister();
    }
    this.pipeline = pipeline;
    this.pipeline.register(this);
  }

  setCamera(entity: Entity): void {
    this.cameraId = entity.get<number>('id');
  }

  getViewMatrix(): Float32Array {
    const {
      cameraId,
      transformComponent,
      transformIndex,
    } = this;
    const output = mat4.create() as Float32Array;
    if (cameraId == null) return output;
    const entity = this.entityStore.getEntity(cameraId);
    if (entity == null) return output;
    const transform = transformIndex.get(entity.getPos(transformComponent));
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
    // Delegate everything to the pipeline
    if (this.pipeline == null) {
      throw new Error('Pipeline is null');
    }
    this.pipeline.render();
  }

  getShaderBuffer(id: number, shader: LowShader): ShaderBuffer {
    let buffer = this.lowShaders.get(id);
    if (buffer == null) {
      buffer = new ShaderBuffer(this.gl);
      this.lowShaders.set(id, buffer);
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

  getTextureBuffer(id: number, texture: Texture): TextureBuffer {
    let buffer = this.textures.get(id);
    if (buffer == null) {
      buffer = new TextureBuffer(this.gl);
      this.textures.set(id, buffer);
    }
    buffer.sync(texture);
    return buffer;
  }

  getTextureBufferById(id: number): TextureBuffer | null {
    const entity = this.entityStore.getEntity(id);
    if (entity == null) return null;
    if (!entity.has(this.textureComponent)) return null;
    const texture = entity.get(this.textureComponent);
    return this.getTextureBuffer(id, texture);
  }

  bindTexture(texBuffer: TextureBuffer): number {
    const len = this.boundTextures.length;
    for (let i = 0; i < len; i += 1) {
      if (this.boundTextures[i] === texBuffer) return i;
    }
    this.boundTextures.push(texBuffer);
    texBuffer.bind(len);
    return len;
  }

  clearBindTexture(): void {
    this.boundTextures = [];
  }
}
