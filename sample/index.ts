import { EntityStore } from '../src/EntityStore';
import { SystemStore } from '../src/SystemStore';
import { MutableComponent } from '../src/components/MutableComponent';
import { Float32ArrayComponent } from '../src/components/Float32ArrayComponent';
import { Component } from '../src/components/Component';

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
  entityStore.addComponent('pos', new Float32ArrayComponent(2));
  entityStore.addComponent('vel', new Float32ArrayComponent(2));
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
    for (let i = 0; i < 4; i += 1) {
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
    const pos = entityStore.getComponent<Float32ArrayComponent>('pos');
    const vel = entityStore.getComponent<Float32ArrayComponent>('vel');
    entityStore.forEachGroupWith([pos, vel], (group, posOffset, velOffset) => {
      const posArr = pos.getArrayOf(posOffset);
      const velArr = vel.getArrayOf(velOffset);
      for (let i = 0; i < group.size; i += 1) {
        posArr[2 * i] += velArr[2 * i];
        posArr[2 * i + 1] += velArr[2 * i + 1];
      }
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
        const x = posArr[2 * i];
        const y = posArr[2 * i + 1];
        if (x < 0 || x > 1 || y < 0 || y > 1) {
          deleteList.push(i);
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
  systemStore.addSystem(() => {
    // Debug display
    const consoleData = String(
      entityStore.entityGroups.reduce((p, v) => p + v.size, 0),
    );
    // JSON.stringify(entityStore.serialize(), null, 2);
    while (debugDiv.firstChild != null) debugDiv.removeChild(debugDiv.firstChild);
    debugDiv.appendChild(document.createTextNode(consoleData));
  });

  const instancedExt = gl.getExtension('ANGLE_instanced_arrays');
  if (instancedExt == null) {
    alert('Instancing is required');
    return;
  }

  const vsCode = `
    attribute vec2 aPosition;
    attribute vec2 aInstancePosition;

    void main() {
      gl_Position = vec4(aPosition + (aInstancePosition * 2.0 - vec2(1.0, 1.0)), -1.0, 1.0);
    }
  `;

  const fsCode = `
    uniform highp vec4 uColor;

    void main() {
      gl_FragColor = uColor;
    }
  `;

  // Initialize shader
  const vShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vShader, vsCode);
  gl.compileShader(vShader);
  if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vShader));
  }

  const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fShader, fsCode);
  gl.compileShader(fShader);
  if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fShader));
  }

  const glProgram = gl.createProgram()!;
  gl.attachShader(glProgram, vShader);
  gl.attachShader(glProgram, fShader);
  gl.linkProgram(glProgram);

  const aPosition = gl.getAttribLocation(glProgram, 'aPosition');
  const aInstancePosition = gl.getAttribLocation(glProgram, 'aInstancePosition');
  const uColor = gl.getUniformLocation(glProgram, 'uColor');

  console.log(aPosition, aInstancePosition);

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0,
      0.05, 0,
      0, 0.05,
      0.05, 0.05,
    ]),
    gl.STATIC_DRAW,
  );

  const instancePosBuffer = gl.createBuffer();

  systemStore.addSystem(() => {
    // Renderer
    /*
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // TODO Clearly we need a method to iterate entities
    const pos = entityStore.getComponent<Component<number[]>>('pos');
    const shape = entityStore.getComponent<Component<Shape>>('shape');
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
    */
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    // We don't use depth testing for now.
    const pos = entityStore.getComponent<Float32ArrayComponent>('pos');
    entityStore.forEachGroupWith([pos], (group, posOffset) => {
      const posArray = pos.getArrayOf(posOffset);
      gl.bindBuffer(gl.ARRAY_BUFFER, instancePosBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        posArray,
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(aInstancePosition);
      gl.vertexAttribPointer(aInstancePosition, 2, gl.FLOAT, false, 0, 0);
      instancedExt.vertexAttribDivisorANGLE(aInstancePosition, 1);

      // Bind aPosition
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.useProgram(glProgram);

      // Bind uColor
      gl.uniform4f(uColor, 1, 1, 1, 1);

      // Finally, issue draw call
      instancedExt.drawArraysInstancedANGLE(
        gl.TRIANGLE_STRIP,
        0,
        4,
        group.size,
      );
    });
  });

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
