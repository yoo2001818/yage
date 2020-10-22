import { mat4 } from 'gl-matrix';
import { EntityStore } from '../src/EntityStore';
import { SystemStore } from '../src/SystemStore';
import { MutableComponent } from '../src/components/MutableComponent';
import { Float32ArrayComponent } from '../src/components/Float32ArrayComponent';
import { LocRotScaleIndex } from '../src/indexes/LocRotScaleIndex';

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
  entityStore.addComponent('pos', new Float32ArrayComponent(12));
  entityStore.addComponent('vel', new Float32ArrayComponent(3));
  entityStore.addComponent('color', new Float32ArrayComponent(3));
  entityStore.addComponent('shape', new MutableComponent<Shape>(() => ({
    type: 'box',
    color: '#fff',
    width: 0.01,
    height: 0.01,
  })));

  entityStore.addIndex('locRotScale', new LocRotScaleIndex('pos'));

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
    for (let i = 0; i < 20; i += 1) {
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
        color: [Math.random(), Math.random(), Math.random()],
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

  const instancedExt = gl.getExtension('ANGLE_instanced_arrays');
  if (instancedExt == null) {
    alert('Instancing is required');
    return;
  }

  const vsCode = `
    attribute vec3 aPosition;
    attribute mat4 aModel;
    attribute vec3 aColor;

    uniform mat4 uView;
    uniform mat4 uProjection;

    varying lowp vec3 vColor;

    void main() {
      vColor = aColor;
      gl_Position = uProjection * uView * aModel * vec4(aPosition, 1.0);
    }
  `;

  const fsCode = `
    varying lowp vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
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
  const aModel = gl.getAttribLocation(glProgram, 'aModel');
  const aColor = gl.getAttribLocation(glProgram, 'aColor');
  // const uColor = gl.getUniformLocation(glProgram, 'uColor');
  const uView = gl.getUniformLocation(glProgram, 'uView');
  const uProjection = gl.getUniformLocation(glProgram, 'uProjection');

  console.log(aPosition, aModel);

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
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
    gl.STATIC_DRAW,
  );

  const instancePosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instancePosBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    65536 * 16,
    gl.DYNAMIC_DRAW,
  );

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    65536 * 3,
    gl.DYNAMIC_DRAW,
  );

  const viewMat = mat4.create();
  const projectionMat = mat4.create();

  mat4.identity(viewMat);
  mat4.translate(viewMat, viewMat, [0, 0, -5]);
  mat4.rotateX(viewMat, viewMat, Math.PI / 8);
  mat4.rotateY(viewMat, viewMat, -Math.PI / 4);
  mat4.perspective(projectionMat, 90 / 180 * Math.PI, 640 / 480, 0.1, 1000);

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
          ctx.fillRect;(
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
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.FRONT);

    const locRotScale = entityStore.getIndex<LocRotScaleIndex>('locRotScale');
    const pos = entityStore.getComponent<Float32ArrayComponent>('pos');
    const color = entityStore.getComponent<Float32ArrayComponent>('color');
    entityStore.forEachGroupWith([pos, color], (group, posOffset, colorOffset) => {
      const posArray = locRotScale.getArrayOf(posOffset);
      gl.bindBuffer(gl.ARRAY_BUFFER, instancePosBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArray.subarray(0, group.size * 16));
      gl.enableVertexAttribArray(aModel);
      gl.enableVertexAttribArray(aModel + 1);
      gl.enableVertexAttribArray(aModel + 2);
      gl.enableVertexAttribArray(aModel + 3);
      gl.vertexAttribPointer(aModel, 4, gl.FLOAT, false, 64, 0);
      gl.vertexAttribPointer(aModel + 1, 4, gl.FLOAT, false, 64, 16);
      gl.vertexAttribPointer(aModel + 2, 4, gl.FLOAT, false, 64, 32);
      gl.vertexAttribPointer(aModel + 3, 4, gl.FLOAT, false, 64, 48);
      instancedExt.vertexAttribDivisorANGLE(aModel, 1);
      instancedExt.vertexAttribDivisorANGLE(aModel + 1, 1);
      instancedExt.vertexAttribDivisorANGLE(aModel + 2, 1);
      instancedExt.vertexAttribDivisorANGLE(aModel + 3, 1);

      const colorArray = color.getArrayOf(colorOffset);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, colorArray.subarray(0, group.size * 3));
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
      instancedExt.vertexAttribDivisorANGLE(aColor, 1);

      // Bind aPosition
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.useProgram(glProgram);

      // Bind uColor
      // gl.uniform4f(uColor, 1, 1, 1, 1);
      gl.uniformMatrix4fv(uView, false, viewMat);
      gl.uniformMatrix4fv(uProjection, false, projectionMat);

      // Finally, issue draw call
      instancedExt.drawArraysInstancedANGLE(
        gl.TRIANGLE_STRIP,
        0,
        14,
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
