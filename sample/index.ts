import { quat, vec3 } from 'gl-matrix';
import { EntityStore } from '../src/store/EntityStore';
import { SystemStore } from '../src/store/SystemStore';
import { createFloat32ArrayComponent, Float32ArrayComponent } from '../src/components/Float32ArrayComponent';
// import { LocRotScaleComponent } from '../src/render/components/LocRotScaleComponent';
import { MaterialComponent } from '../src/render/components/MaterialComponent';
import { GeometryComponent } from '../src/render/components/GeometryComponent';
import { ShaderComponent } from '../src/render/components/ShaderComponent';
import { MeshComponent } from '../src/render/components/MeshComponent';
import { CameraComponent } from '../src/render/components/CameraComponent';
import { LocRotScaleIndex } from '../src/indexes/LocRotScaleIndex';
import { Geometry } from '../src/render/Geometry';
import { RenderSystem } from '../src/render/systems/RenderSystem';

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
  entityStore.addComponent('pos', createFloat32ArrayComponent(12));
  entityStore.addComponent('material', new MaterialComponent());
  entityStore.addComponent('geometry', new GeometryComponent());
  entityStore.addComponent('shader', new ShaderComponent());
  entityStore.addComponent('mesh', new MeshComponent());
  entityStore.addComponent('camera', new CameraComponent());
  entityStore.addComponent('vel', createFloat32ArrayComponent(3));

  entityStore.addIndex('locRotScale', new LocRotScaleIndex('pos'));

  // Create generic material and geometry

  const box = entityStore.createEntity();
  const boxId = box.get<number>('id');
  box.set('shader', {
    vertShader: `
    attribute vec3 aPosition;

    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform mat4 uModel;

    varying lowp vec3 vColor;

    void main() {
      vColor = vec3(1.0, 1.0, 1.0);
      gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    }
    `,
    fragShader: `
    varying lowp vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `,
  });
  box.set('material', { shaderId: boxId, uniforms: {} });
  box.set('geometry', new Geometry({
    attributes: {
      aPosition: {
        data: new Float32Array([
          -1, 1, 1,
          1, 1, 1,
          -1, -1, 1,
          1, -1, 1,
          1, -1, -1,
          1, 1, 1,
          1, 1, -1,
          -1, 1, 1,
          -1, 1, -1,
          -1, -1, 1,
          -1, -1, -1,
          1, -1, -1,
          -1, 1, -1,
          1, 1, 1,
        ]),
        axis: 3,
      },
    },
    mode: gl.TRIANGLE_STRIP,
  }));

  const camera = entityStore.createEntity({
    pos: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
    camera: {
      type: 'perspective',
      near: 0.1,
      far: 100,
      fov: 90 / 180 * Math.PI,
    },
  });
  const cameraPos = camera.get<Float32Array>('pos')!;
  vec3.copy(cameraPos.subarray(0, 4), [-5 / 2, 2.5 / 2, 5 / 2]);
  quat.rotateY(cameraPos.subarray(4, 8), cameraPos.subarray(4, 8), -Math.PI / 4);
  quat.rotateX(cameraPos.subarray(4, 8), cameraPos.subarray(4, 8), -Math.PI / 8);
  camera.markChanged('pos');

  /*
  {
    const camera = entityStore.createEntity({
      pos: true,
      camera: {
        type: 'perspective',
        near: 0.1,
        far: 100,
        fov: 90 / 180 * Math.PI,
      },
    });

    const cameraPos = camera.get<LocRotScale>('pos');
    cameraPos.setLocation([-5 / 2, 2.5 / 2, 5 / 2]);
    // cameraPos.setRotationXYZ([-Math.PI / 8, -Math.PI / 4, 0 ]);
    cameraPos.lookAt([0, 0, 0]);
    camera.markChanged('pos');
  }
  */

  const renderer = new RenderSystem(entityStore, gl);
  renderer.setCamera(camera);

  // Initialize system store
  const systemStore = new SystemStore();

  // Add bunch of systems
  systemStore.addSystem((event) => {
    // Game initializer
    if (event !== 'init') return;
    /*
    entityStore.createEntity({
      pos: [0, 0, -1.5, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      vel: [0.01, 0],
      shape: {},
    });
    entityStore.createEntity({
      pos: [0, 0, 2.5, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      vel: [-0.007, 0.007],
      shape: {},
    });
    */
  });
  systemStore.addSystem(() => {
    for (let i = 0; i < 2; i += 1) {
      // Spawn one more... Sort of?
      let xDir = Math.random() * 2 - 1;
      let yDir = Math.random() * 2 - 1;
      let zDir = Math.random() * 2 - 1;
      const dist = Math.sqrt(xDir * xDir + yDir * yDir + zDir * zDir);
      xDir /= dist;
      yDir /= dist;
      zDir /= dist;
      entityStore.createEntity({
        pos: [0, 0, 0, 0, 0, 0, 0, 1, 0.1, 0.1, 0.1, 0],
        vel: [xDir * 0.03, yDir * 0.03, zDir * 0.03],
        mesh: [boxId, boxId],
      });
    }
  });
  systemStore.addSystem(() => {
    // Step
    const pos = entityStore.getComponent<Float32ArrayComponent>('pos');
    const vel = entityStore.getComponent<Float32ArrayComponent>('vel');
    entityStore.forEachGroupWith([pos, vel], (group, posOffset, velOffset) => {
      const posArr = pos.getArrayOf(posOffset);
      const velArr = vel.getArrayOf(velOffset);
      for (let i = 0; i < group.size; i += 1) {
        posArr[12 * i] += velArr[3 * i];
        posArr[12 * i + 1] += velArr[3 * i + 1];
        posArr[12 * i + 2] += velArr[3 * i + 2];
      }
      pos.markChanged(group);
    });
    /*
    entityStore.forEachWith([pos, vel], (_, entityPos, entityVel) => {
      entityPos[0] += entityVel[0];
      entityPos[1] += entityVel[1];
    });
    */
    /*
    entityStore.forEach([pos, vel], (pos, vel) => {
      pos[0] += vel[0];
      pos[1] += vel[1];
    });
    */
  });
  systemStore.addSystem(() => {
    // Respawn
    /*
    const pos = entityStore.getComponent<Component<number[]>>('pos');
    entityStore.forEachWith([pos], (entity, entityPos) => {
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
    const pos = entityStore.getComponent<Float32ArrayComponent>('pos');
    entityStore.forEachGroupWith([pos], (group, posOffset) => {
      const posArr = pos.getArrayOf(posOffset);
      const deleteList = [];
      for (let i = 0; i < group.size; i += 1) {
        const x = posArr[12 * i];
        const y = posArr[12 * i + 1];
        const z = posArr[12 * i + 2];
        if (x < -10 || x > 10 || y < -10 || y > 10 || z < -10 || z > 10) {
          deleteList.push(i);
          posArr[12 * i] = 0;
          posArr[12 * i + 1] = 0;
          posArr[12 * i + 2] = 0;
        }
      }
      for (let i = 0; i < deleteList.length; i += 1) {
        entityStore.getEntityOfGroup(group, deleteList[i]).destroy();
      }
    });
    /*
    entityStore.forEach([pos], (pos) => {
      if (pos[0] < 0) pos[0] = 1;
      if (pos[0] > 1) pos[0] = 0;
      if (pos[1] < 0) pos[1] = 1;
      if (pos[1] > 1) pos[1] = 0;
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
