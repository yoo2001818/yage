import { vec3 } from 'gl-matrix';
import { EntityStore } from '../src/store/EntityStore';
import { SystemStore } from '../src/store/SystemStore';
import {
  createFloat32ArrayComponent,
  Float32ArrayComponent,
} from '../src/components/Float32ArrayComponent';
import { createComponents } from '../src/render/components/createComponents';
import { TransformIndex } from '../src/indexes/TransformIndex';
import { Geometry } from '../src/render/Geometry';
import { RenderSystem } from '../src/render/systems/RenderSystem';

import { box } from '../src/geom/box';
import { uvSphere } from '../src/geom/uvSphere';
import { calcNormals } from '../src/geom/calcNormals';
import { Transform } from '../src/render/Transform';

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

  const boxEnt = entityStore.createEntity();
  const boxId = boxEnt.getId();
  boxEnt.set('shader', {
    vertShader: `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    // Instanced
    attribute mat4 aModel;

    uniform mat4 uView;
    uniform mat4 uProjection;
    // uniform mat4 uModel;
    uniform vec4 uColor;

    varying lowp vec3 vColor;

    void main() {
      vColor = uColor.xyz +
        (normalize(uView * aModel * vec4(aNormal, 0.0)).xyz * 0.5 + 0.5) * uColor.w;
      // vColor = vec3(1.0, 1.0, 1.0);
      gl_Position = uProjection * uView * aModel * vec4(aPosition, 1.0);
    }
    `,
    fragShader: `
    varying lowp vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `,
  });
  boxEnt.set('material', { shaderId: boxId, uniforms: { uColor: [0, 0, 0, 1] } });
  boxEnt.set('geometry', new Geometry(calcNormals(box())));

  const sphereEnt = entityStore.createEntity({
    geometry: new Geometry(uvSphere(10, 10)),
    material: { shaderId: boxId, uniforms: { uColor: [0, 0.8, 0, 0.2] } },
  });
  const sphereId = sphereEnt.getId();

  const camera = entityStore.createEntity({
    transform: new Transform(),
    camera: {
      type: 'perspective',
      near: 0.1,
      far: 100,
      fov: 90 / 180 * Math.PI,
    },
  });
  const cameraPos = camera.get<Transform>('transform')!;
  cameraPos.translate([-5 / 2, 2.5 / 2, 5 / 2]);
  cameraPos.lookAt([0, 0, 0], [0, 1, 0]);
  camera.markChanged('transform');

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

  systemStore.addSystem(() => {
    for (let i = 0; i < 20; i += 1) {
      // Spawn one more... Sort of?
      let xDir = Math.random() * 2 - 1;
      let yDir = Math.random() * 2 - 1;
      let zDir = Math.random() * 2 - 1;
      const dist = Math.sqrt(xDir * xDir + yDir * yDir + zDir * zDir);
      xDir /= dist;
      yDir /= dist;
      zDir /= dist;
      const transform = new Transform();
      vec3.set(transform.scale, 0.1, 0.1, 0.1);
      entityStore.createEntity({
        transform,
        vel: [xDir * 0.03, yDir * 0.03, zDir * 0.03],
        mesh: {
          materialId: Math.random() > 0.5 ? boxId : sphereId,
          geometryId: Math.random() > 0.5 ? boxId : sphereId,
        },
      });
    }
  });
  systemStore.addSystem(() => {
    // Step
    const transform = entityStore.getComponent<Float32ArrayComponent>('transform');
    const vel = entityStore.getComponent<Float32ArrayComponent>('vel');
    entityStore.forEachGroupWith([transform, vel], (group, transformOffset, velOffset) => {
      const transformArr = transform.getArrayOf(transformOffset);
      const velArr = vel.getArrayOf(velOffset);
      for (let i = 0; i < group.size; i += 1) {
        transformArr[12 * i] += velArr[3 * i];
        transformArr[12 * i + 1] += velArr[3 * i + 1];
        transformArr[12 * i + 2] += velArr[3 * i + 2];
      }
      transform.markChanged(group);
    });
    /*
    entityStore.forEachWith([transform, vel], (_, entityPos, entityVel) => {
      entityPos[0] += entityVel[0];
      entityPos[1] += entityVel[1];
    });
    */
    /*
    entityStore.forEach([transform, vel], (transform, vel) => {
      transform[0] += vel[0];
      transform[1] += vel[1];
    });
    */
  });
  systemStore.addSystem(() => {
    // Respawn
    /*
    const transform = entityStore.getComponent<Component<number[]>>('transform');
    entityStore.forEachWith([transform], (entity, entityPos) => {
      if (
        entityPos[0] < 0
        || entityPos[0] > 1
        || entityPos[1] < 0
        || entityPos[1] > 1
      ) {
        entity.destroy();
      }
    });
    */
    const transform = entityStore.getComponent<Float32ArrayComponent>('transform');
    entityStore.forEachGroupWith([transform], (group, transformOffset) => {
      const transformArr = transform.getArrayOf(transformOffset);
      const deleteList = [];
      for (let i = 0; i < group.size; i += 1) {
        const x = transformArr[12 * i];
        const y = transformArr[12 * i + 1];
        const z = transformArr[12 * i + 2];
        if (x < -10 || x > 10 || y < -10 || y > 10 || z < -10 || z > 10) {
          deleteList.push(i);
          transformArr[12 * i] = 0;
          transformArr[12 * i + 1] = 0;
          transformArr[12 * i + 2] = 0;
        }
      }
      for (let i = 0; i < deleteList.length; i += 1) {
        entityStore.getEntityOfGroup(group, deleteList[i]).destroy();
      }
    });
    /*
    entityStore.forEach([transform], (transform) => {
      if (transform[0] < 0) transform[0] = 1;
      if (transform[0] > 1) transform[0] = 0;
      if (transform[1] < 0) transform[1] = 1;
      if (transform[1] > 1) transform[1] = 0;
    });
    */
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
