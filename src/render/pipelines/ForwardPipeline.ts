import { ShaderPassDescriptor } from 'src/types/Shader';
import { Geometry } from '../Geometry';
import { ShaderBuffer } from '../gl/ShaderBuffer';
import { LowShader } from '../LowShader';
import { Pipeline } from './Pipeline';

export class ForwardPipeline extends Pipeline {
  instancedGeom: Geometry;

  constructor() {
    super();
    this.instancedGeom = new Geometry();
  }

  bakeShaderPass(
    shaderId: number,
    passId: number,
    shader: ShaderPassDescriptor,
  ): LowShader {
    return { vertShader: '', fragShader: '' };
  }

  renderGeometry(
    uView: Float32Array,
    uProjection: Float32Array,
    transform: Float32Array,
    geometryId: number,
    geometry: Geometry,
    shaderBuf: ShaderBuffer,
    size: number,
  ): void {
    const { renderSystem } = this;
    if (renderSystem == null) return;
    // Then, set geometry
    const geometryBuf = renderSystem.getGeometryBuffer(geometryId, geometry);
    geometryBuf.bind(shaderBuf);
    // TODO: Set up camera and lights, instancing.
    shaderBuf.setUniforms(renderSystem, {
      uView,
      uProjection,
    });
    // Set instanced geometry (if supported)
    if (shaderBuf.attributes.has('aModel')) {
      // TODO: Really?
      this.instancedGeom.setAttribute('aModel', {
        data: transform.subarray(0, size * 16),
        axis: 16,
      });
      const instancedBuf = renderSystem.getGeometryBuffer(
        9999999,
        this.instancedGeom,
      );
      const primCount = instancedBuf.bind(shaderBuf, 1);
      geometryBuf.render(primCount);
    } else {
      // The shader doesn't support instancing, fall back to regular routine
      for (let i = 0; i < size; i += 1) {
        shaderBuf.setUniforms(renderSystem, {
          uModel: transform.subarray(i * 16, i * 16 + 16),
        });
        geometryBuf.render();
      }
    }
  }

  render(): void {
    const { renderSystem } = this;
    if (renderSystem == null) return;
    const {
      gl,
      entityStore,
      meshComponent,
      transformComponent,
      transformIndex,
    } = renderSystem;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable bunch of test
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.BACK);
    const uView = renderSystem.getViewMatrix();
    const uProjection = renderSystem.getProjectionMatrix();
    renderSystem.entityStore.forEachGroupWith([
      meshComponent,
      transformComponent,
    ], (group, meshPos, transformPos) => {
      const { materialId, geometryId } = meshComponent.get(meshPos);
      const transform = transformIndex.getArrayOf(transformPos);
      // Prepare geometry and material
      const geometry = entityStore
        .getComponentOfEntity(geometryId, renderSystem.geometryComponent);
      const material = entityStore
        .getComponentOfEntity(materialId, renderSystem.materialComponent);
      const shader = entityStore
        .getComponentOfEntity(material.shaderId, renderSystem.shaderComponent);
      shader.passes.forEach((pass, passId) => {
        if (pass.type === 'combined') return;
        // Prepare shader
        // TODO Caching
        const lowShader = this.bakeShaderPass(
          material.shaderId,
          passId,
          pass,
        );
        const shaderBuf = renderSystem.getShaderBuffer(
          material.shaderId * 100 + passId,
          lowShader,
        );
        shaderBuf.bind();
        renderSystem.clearBindTexture();
        shaderBuf.setUniforms(renderSystem, material.uniforms);
        this.renderGeometry(
          uView,
          uProjection,
          transform,
          geometryId,
          geometry,
          shaderBuf,
          group.size,
        );
      });
    });
  }
}
