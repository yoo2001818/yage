import { EntityStore } from '../src/EntityStore';
import { SystemStore } from '../src/SystemStore';
import { BaseComponentArray } from '../src/ComponentArray';

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
  entityStore.addComponent('pos', new BaseComponentArray(() => [0, 0]));
  entityStore.addComponent('vel', new BaseComponentArray(() => [0, 0]));
  entityStore.addComponent('shape', new BaseComponentArray<Shape>(() => ({
    type: 'box',
    color: '#fff',
    width: 0.1,
    height: 0.1,
  })));

  // Initialize system store
  const systemStore = new SystemStore();

  // Add bunch of systems
  systemStore.addSystem((event) => {
    // Game initializer
    if (event !== 'init') return;
    /*
    const entity = entityStore.createEntity();
    // This is extremely cumbersome
    entity.add('pos');
    entity.add('vel');
    entity.add('shape');
    entity.get<number[]>('pos')[0] = 0.5;
    entity.get<number[]>('pos')[1] = 0.5;
    entity.get<number[]>('vel')[0] = 0.01;
    entity.get<number[]>('vel')[1] = 0;
    entityStore.unfloatEntity(entity);
    */
    // This can be changed to...
    entityStore.createEntityWith({
      pos: [0.5, 0.5],
      vel: [0.01, 0],
    });
  });
  systemStore.addSystem(() => {
    // Step
    const pos = entityStore.getComponent<number[]>('pos');
    const vel = entityStore.getComponent<number[]>('vel');
    entityStore.forEach((group, index) => {
      if (!group.hasComponent(pos) || !group.hasComponent(vel)) return;
      const entityPos = group.getComponent(pos, index);
      const entityVel = group.getComponent(vel, index);
      entityPos[0] += entityVel[0];
      entityPos[1] += entityVel[1];
    });
  });
  systemStore.addSystem(() => {
    // Respawn
    const pos = entityStore.getComponent<number[]>('pos');
    entityStore.forEach((group, index) => {
      if (!group.hasComponent(pos)) return;
      const entityPos = group.getComponent(pos, index);
      if (entityPos[0] < 0) entityPos[0] = 1;
      if (entityPos[0] > 1) entityPos[0] = 0;
      if (entityPos[1] < 0) entityPos[1] = 1;
      if (entityPos[1] > 1) entityPos[1] = 0;
    });
  });
  systemStore.addSystem(() => {
    // Debug display
    const consoleData = JSON.stringify(entityStore.serialize(), null, 2);
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
    entityStore.forEach((group, index) => {
      if (!group.hasComponent(pos) || !group.hasComponent(shape)) return;
      const entityPos = group.getComponent(pos, index);
      const entityShape = group.getComponent(shape, index);
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
