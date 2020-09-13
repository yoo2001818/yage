import { EntityStore } from '../src/EntityStore';
import { SystemStore } from '../src/SystemStore';
import { MutableComponent } from '../src/components/MutableComponent';

interface Shape {
  type: string,
  color: string,
  width: number,
  height: number,
}

function main() {
  // Initialize game renderer
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Unable to initialize');
  }

  // Initialize debug console.... which just dumps game state every frame.
  const debugDiv = document.createElement('pre');
  document.body.appendChild(debugDiv);

  // Initialize entity store
  const entityStore = new EntityStore();

  // Add needed components
  entityStore.addComponent('pos', new MutableComponent(() => [0, 0]));
  entityStore.addComponent('vel', new MutableComponent(() => [0, 0]));
  entityStore.addComponent('shape', new MutableComponent<Shape>(() => ({
    type: 'box',
    color: '#fff',
    width: 0.01,
    height: 0.01,
  })));

  // Initialize system store
  const systemStore = new SystemStore();

  // Add bunch of systems
  systemStore.addSystem((event) => {
    // Game initializer
    if (event !== 'init') return;
    entityStore.createEntity({
      pos: [0.5, 0.5],
      vel: [0.01, 0],
      shape: {},
    });
    entityStore.createEntity({
      pos: [0.5, 0.6],
      vel: [-0.007, 0.007],
      shape: {},
    });
  });
  systemStore.addSystem(() => {
    for (let i = 0; i < 2; i += 1) {
      // Spawn one more... Sort of?
      let xDir = Math.random() * 2 - 1;
      let yDir = Math.random() * 2 - 1;
      const dist = Math.sqrt(xDir * xDir + yDir * yDir);
      xDir /= dist;
      yDir /= dist;
      entityStore.createEntity({
        pos: [-xDir / 2 + 0.5, -yDir / 2 + 0.5],
        vel: [xDir * 0.01, yDir * 0.01],
        shape: {},
      });
    }
  });
  systemStore.addSystem(() => {
    // Step
    const pos = entityStore.getComponent<number[]>('pos');
    const vel = entityStore.getComponent<number[]>('vel');
    entityStore.forEachWith([pos, vel], (_, entityPos, entityVel) => {
      entityPos[0] += entityVel[0];
      entityPos[1] += entityVel[1];
    });
    /*
    entityStore.forEach([pos, vel], (pos, vel) => {
      pos[0] += vel[0];
      pos[1] += vel[1];
    });
    */
  });
  systemStore.addSystem(() => {
    // Respawn
    const pos = entityStore.getComponent<number[]>('pos');
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
    /*
    entityStore.forEach([pos], (pos) => {
      if (pos[0] < 0) pos[0] = 1;
      if (pos[0] > 1) pos[0] = 0;
      if (pos[1] < 0) pos[1] = 1;
      if (pos[1] > 1) pos[1] = 0;
    });
    */
  });
  systemStore.addSystem(() => {
    // Debug display
    const consoleData = String(
      entityStore.entityGroups.reduce((p, v) => p + v.size, 0),
    );
    // JSON.stringify(entityStore.serialize(), null, 2);
    while (debugDiv.firstChild != null) debugDiv.removeChild(debugDiv.firstChild);
    debugDiv.appendChild(document.createTextNode(consoleData));
  });
  systemStore.addSystem(() => {
    // Renderer
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // TODO Clearly we need a method to iterate entities
    const pos = entityStore.getComponent<number[]>('pos');
    const shape = entityStore.getComponent<Shape>('shape');
    entityStore.forEach((entity) => {
      if (!entity.has(pos) || !entity.has(shape)) return;
      const entityPos = entity.get(pos)!;
      const entityShape = entity.get(shape)!;
      ctx.fillStyle = entityShape.color;
      switch (entityShape.type) {
        case 'box':
          ctx.fillRect(
            entityPos[0] * canvas.width | 0,
            entityPos[1] * canvas.height | 0,
            entityShape.width * canvas.width | 0,
            entityShape.height * canvas.height | 0,
          );
          break;
        default:
      }
    });
  });

  // Initialize game step
  systemStore.run('init');

  function next() {
    systemStore.run('tick');
    requestAnimationFrame(next);
  }
  requestAnimationFrame(next);
}

main();
