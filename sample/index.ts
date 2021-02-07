import {
  EntityStore,
  SystemStore,
  createFloat32ArrayComponent,
  createRenderComponents,
  TransformIndex,
  RenderSystem,
  BlenderControllerSystem,
  BlenderControllerTarget,
  ImmutableComponent,
  Transform,
  Texture,
  Shader,
  Material,
  Mesh,
  parseObj,
} from '../src';

import textureImg from './logobg.png';
import phongVert from './phong.vert';
import phongFrag from './phong.frag';
import suzanneObj from './suzannewithhat.obj';

import './index.css';

function main() {
  // Initialize game renderer
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;

  const gl = canvas.getContext('webgl');
  if (gl == null) return;

  window.addEventListener('resize', () => {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  });

  // Initialize debug console.... which just dumps game state every frame.
  const debugDiv = document.createElement('pre');
  document.body.appendChild(debugDiv);

  // Initialize entity store
  const entityStore = new EntityStore();

  // Add needed components
  entityStore.addComponents(createRenderComponents());
  entityStore.addComponent('vel', createFloat32ArrayComponent(3));
  entityStore.addComponent(
    'blenderController',
    new ImmutableComponent<BlenderControllerTarget>(),
  );

  entityStore.addIndex('transform', new TransformIndex('transform'));

  const renderer = new RenderSystem(entityStore, canvas);

  // Initialize system store
  const systemStore = new SystemStore();

  systemStore.addSystem(new BlenderControllerSystem(entityStore, canvas));
  systemStore.addSystem(renderer);

  // Initialize game step
  systemStore.run('init');

  function next() {
    systemStore.run('tick');
    requestAnimationFrame(next);
  }
  requestAnimationFrame(next);
  console.log(entityStore);
  // Create generic material and geometry

  const objParsed = parseObj(suzanneObj);

  const boxImg = new Image();
  boxImg.src = textureImg;
  const materialEnt = entityStore.createEntity({
    texture: new Texture(boxImg),
    shader: {
      passes: [{
        type: 'forward',
        options: {
          cull: gl.BACK,
          depth: gl.LESS,
        },
        vert: phongVert,
        frag: phongFrag,
      }],
    },
  });
  const materialId = materialEnt.getId();
  objParsed.forEach((entity) => {
    const meshEnt = entityStore.createEntity({
      transform: new Transform(),
      geometry: entity.geometry,
    });
    meshEnt.get<Transform>('transform').setScale([2, 2, 2]);
    const color = [Math.random(), Math.random(), Math.random()];
    meshEnt.set<Material>('material', {
      shaderId: materialId,
      uniforms: {
        uMaterial: {
          ambient: color,
          diffuse: color,
          specular: [1.0, 1.0, 1.0],
          shininess: 50,
        },
        uPointLight: [{
          position: [5, 10, 0],
          color: [1, 1, 1],
          intensity: [0.3, 0.7, 0.5, 0.001],
        }],
        uDiffuseMap: materialId,
      },
    });
    const meshEntId = meshEnt.getId();
    meshEnt.set<Mesh>('mesh', { materialId: meshEntId, geometryId: meshEntId });
    meshEnt.unfloat();
    console.log(entity.geometry);
  });
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
    blenderController: {
      center: [0, 0, 0],
      distance: 6,
    },
  });
  renderer.setCamera(camera);
}

main();
