import { Geometry } from '../Geometry';
import { LowShader } from '../LowShader';
import { Shader } from '../Shader';
import { Pipeline } from './Pipeline';

export class ForwardPipeline extends Pipeline {
  instancedGeom: Geometry;

  constructor() {
    super();
    this.instancedGeom = new Geometry();
  }

  bakeShader(shader: Shader): LowShader {

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
      // Acquire shader buffer and use it
      const shaderBuf = renderSystem.getShaderBuffer(material.shaderId, shader);
      shaderBuf.bind();
      renderSystem.clearBindTexture();
      shaderBuf.setUniforms(renderSystem, material.uniforms);
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
          data: transform.subarray(0, group.size * 16),
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
        for (let i = 0; i < group.size; i += 1) {
          shaderBuf.setUniforms(renderSystem, {
            uModel: transform.subarray(i * 16, i * 16 + 16),
          });
          geometryBuf.render();
        }
      }
    });
  }
}
