import { vec3 } from 'gl-matrix';
import { EntityStore } from '../src/store/EntityStore';
import { SystemStore } from '../src/store/SystemStore';
import {
  createFloat32ArrayComponent,
  Float32ArrayComponent,
} from '../src/components/Float32ArrayComponent';
import { createComponents } from '../src/render/components/createComponents';
import { TransformIndex } from '../src/indexes/TransformIndex';
import { RenderSystem } from '../src/render/systems/RenderSystem';

import { Transform } from '../src/render/Transform';
import { Texture } from '../src/render/Texture';
import { Shader } from '../src/render/Shader';
import { Material } from '../src/render/Material';
import { Mesh } from '../src/render/Mesh';
import { parseObj } from '../src/formats/obj';

import textureImg from './logobg.png';
import phongVert from './phong.vert';
import phongFrag from './phong.frag';
import suzanneObj from './suzanne.obj';

function main() {
  // Initialize game renderer
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = 640;
  canvas.height = 480;
  const gl = canvas.getContext('webgl');
  if (gl == null) {
    throw new Error('Unable to initialize');
  }

  // Initialize debug console.... which just dumps game state every frame.
  const debugDiv = document.createElement('pre');
  document.body.appendChild(debugDiv);

  // Initialize entity store
  const entityStore = new EntityStore();

  // Add needed components
  entityStore.addComponents(createComponents());
  entityStore.addComponent('vel', createFloat32ArrayComponent(3));

  entityStore.addIndex('transform', new TransformIndex('transform'));

  // Create generic material and geometry

  const objParsed = parseObj(suzanneObj);

  const sphereEnt = entityStore.createEntity({
    transform: new Transform(),
    geometry: objParsed[0].geometry,
  });
  sphereEnt.get<Transform>('transform').setScale([2, 2, 2]);
  const boxImg = new Image();
  boxImg.src = textureImg;
  sphereEnt.set('texture', new Texture(boxImg));
  const sphereId = sphereEnt.getId();
  sphereEnt.set<Shader>('shader', {
    passes: [{
      type: 'forward',
      options: {
        cull: gl.BACK,
        depth: gl.LESS,
      },
      vert: phongVert,
      frag: phongFrag,
    }],
  });
  sphereEnt.set<Material>('material', {
    shaderId: sphereId,
    uniforms: {
      uMaterial: {
        ambient: '#FCF364',
        diffuse: '#FCF364',
        specular: [1.0, 1.0, 1.0],
        shininess: 50,
      },
      uPointLight: [{
        position: [5, 10, 0],
        color: [1, 1, 1],
        intensity: [0.3, 0.7, 0.5, 0.001],
      }],
      uDiffuseMap: sphereId,
    },
  });
  sphereEnt.set<Mesh>('mesh', { materialId: sphereId, geometryId: sphereId });
  // TODO: Transform don't work if specified here
  // sphereEnt.get<Transform>('transform').setScale([2, 2, 2]);
  // sphereEnt.unfloat();

  const camera = entityStore.createEntity({
    transform: new Transform(),
    camera: {
      type: 'perspective',
      near: 0.1,
      far: 100,
      fov: 90 / 180 * Math.PI,
    },
  });
  /*
  {
    const camera = entityStore.createEntity({
      transform: true,
      camera: {
        type: 'perspective',
        near: 0.1,
        far: 100,
        fov: 90 / 180 * Math.PI,
      },
    });

    const cameraPos = camera.get<LocRotScale>('transform');
    cameraPos.setLocation([-5 / 2, 2.5 / 2, 5 / 2]);
    // cameraPos.setRotationXYZ([-Math.PI / 8, -Math.PI / 4, 0 ]);
    cameraPos.lookAt([0, 0, 0]);
    camera.markChanged('transform');
  }
  */

  const renderer = new RenderSystem(entityStore, gl);
  renderer.setCamera(camera);

  // Initialize system store
  const systemStore = new SystemStore();

  let timer = 0;
  systemStore.addSystem(() => {
    const cameraPos = camera.get<Transform>('transform')!;
    cameraPos.setPosition([Math.cos(timer) * 5, 2.5 / 2, Math.sin(timer) * 5]);
    cameraPos.lookAt([0, 0, 0], [0, 1, 0]);
    camera.markChanged('transform');
    timer += 0.003;
  });
  systemStore.addSystem(renderer);

  // Initialize game step
  systemStore.run('init');

  function next() {
    systemStore.run('tick');
    requestAnimationFrame(next);
  }
  requestAnimationFrame(next);
  console.log(entityStore);
}

main();
