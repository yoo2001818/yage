import { ShaderPassDescriptor } from 'src/types/Shader';
import { Geometry } from '../Geometry';
import { ShaderBuffer } from '../gl/ShaderBuffer';
import { LowShader } from '../LowShader';
import { Pipeline } from './Pipeline';

export class ForwardPipeline extends Pipeline {
  lowShaders: Map<number, { value: LowShader, key: ShaderPassDescriptor }>;

  instancedGeom: Geometry;

  constructor() {
    super();
    this.lowShaders = new Map();
    this.instancedGeom = new Geometry();
  }

  bakeShaderPass(
    shaderId: number,
    passId: number,
    shader: ShaderPassDescriptor,
  ): LowShader {
    const id = shaderId * 100 + passId;
    const item = this.lowShaders.get(id);
    if (item == null || item.key !== shader) {
      const newItem = {
        key: shader,
        value: {
          vertShader: shader.vert,
          fragShader: shader.frag,
        },
      };
      this.lowShaders.set(id, newItem);
      return newItem.value;
    }
    return item.value;
  }

  setShaderOptions(pass: ShaderPassDescriptor): void {
    if (pass.type === 'combined') return;
    const { options = {} } = pass;
    const { gl } = this.renderSystem!;
    if (options.blend) {
      const { color, equation, func } = options.blend;
      gl.enable(gl.BLEND);
      gl.blendColor(color[0], color[1], color[2], color[3]);
      if (typeof equation === 'number') {
        gl.blendEquation(equation);
      } else {
        gl.blendEquationSeparate(equation[0], equation[1]);
      }
      if (typeof func[0] === 'number') {
        const arr = func as [number, number];
        gl.blendFunc(arr[0], arr[1]);
      } else {
        const arr = func as [[number, number], [number, number]];
        gl.blendFuncSeparate(arr[0][0], arr[0][1], arr[1][0], arr[1][1]);
      }
    } else {
      gl.disable(gl.BLEND);
    }
    if (options.colorMask) {
      const { colorMask } = options;
      gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
    } else {
      gl.colorMask(true, true, true, true);
    }
    if (options.depthMask) {
      const { depthMask } = options;
      gl.depthMask(depthMask);
    } else {
      gl.depthMask(true);
    }
    if (options.stencilMask) {
      const { stencilMask } = options;
      if (typeof stencilMask === 'number') {
        gl.stencilMask(stencilMask);
      } else {
        gl.stencilMaskSeparate(gl.FRONT, stencilMask[0]);
        gl.stencilMaskSeparate(gl.BACK, stencilMask[1]);
      }
    } else {
      gl.stencilMask(0x7FFFFFFF);
    }
    if (options.cull) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(options.cull);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    if (options.depth) {
      const { depth } = options;
      gl.enable(gl.DEPTH_TEST);
      if (typeof depth === 'number') {
        gl.depthFunc(depth);
        gl.depthRange(0, 1);
      } else {
        gl.depthFunc(depth.func);
        gl.depthRange(depth.range[0], depth.range[1]);
      }
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    if (options.dither) {
      gl.enable(gl.DITHER);
    } else {
      gl.disable(gl.DITHER);
    }
    if (options.stencil) {
      const { func, op } = options.stencil;
      gl.enable(gl.STENCIL_TEST);
      if (typeof func[0] === 'number') {
        const arr = func as number[];
        gl.stencilFunc(arr[0], arr[1], arr[2]);
      } else {
        const arr = func as number[][];
        gl.stencilFuncSeparate(gl.FRONT, arr[0][0], arr[0][1], arr[0][2]);
        gl.stencilFuncSeparate(gl.BACK, arr[1][0], arr[1][1], arr[1][2]);
      }
      if (typeof op[0] === 'number') {
        const arr = op as number[];
        gl.stencilOp(arr[0], arr[1], arr[2]);
      } else {
        const arr = op as number[][];
        gl.stencilOpSeparate(gl.FRONT, arr[0][0], arr[0][1], arr[0][2]);
        gl.stencilOpSeparate(gl.BACK, arr[1][0], arr[1][1], arr[1][2]);
      }
    } else {
      gl.disable(gl.STENCIL_TEST);
    }
    if (options.viewport) {
      const { viewport } = options;
      gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
    } else {
      // TODO: We can't reset this without canvas object!!
    }
    if (options.scissor) {
      const { scissor } = options;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(scissor[0], scissor[1], scissor[2], scissor[3]);
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (options.polygonOffset) {
      const { polygonOffset } = options;
      gl.polygonOffset(polygonOffset[0], polygonOffset[1]);
    } else {
      gl.polygonOffset(0, 0);
    }
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
        this.setShaderOptions(pass);
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
