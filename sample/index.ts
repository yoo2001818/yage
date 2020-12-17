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
import { Texture } from '../src/render/Texture';
import { Shader } from '../src/render/Shader';

import textureImg from './logobg.png';

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
  boxEnt.set<Shader>('shader', {
    passes: [{
      type: 'forward',
      options: {
        cull: gl.BACK,
        depth: gl.LESS,
      },
      vert: `
    #version 100
    precision lowp float;

    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;
    // Instanced
    attribute mat4 aModel;

    uniform mat4 uView;
    uniform mat4 uProjection;
    // uniform mat4 uModel;
    uniform vec4 uColor;

    varying lowp vec3 vPosition;
    varying lowp vec2 vTexCoord;
    varying lowp vec3 vViewPos;
    varying lowp vec3 vNormal;

    vec3 getViewPosWorld() {
      return -mat3(
        uView[0].x, uView[1].x, uView[2].x,
        uView[0].y, uView[1].y, uView[2].y,
        uView[0].z, uView[1].z, uView[2].z
        ) * uView[3].xyz;
    }

    void main() {
      vec4 fragPos = aModel * vec4(aPosition, 1.0);
      gl_Position = uProjection * uView * fragPos;
      vTexCoord = aTexCoord;
      vPosition = fragPos.xyz;
      // NOTE: This is not mathmatically accurate
      mat3 normalMat = mat3(aModel[0].xyz, aModel[1].xyz, aModel[2].xyz);
      vNormal = normalMat * aNormal;
      vViewPos = getViewPosWorld();
    }
    `,
      frag: `
    #version 100
    precision lowp float;

    varying lowp vec3 vPosition;
    varying lowp vec3 vNormal;
    varying lowp vec2 vTexCoord;
    varying lowp vec3 vViewPos;

    lowp vec3 normal;
    lowp vec3 fragPos;

    struct Material {
      lowp vec3 ambient;
      lowp vec3 diffuse;
      lowp vec3 specular;

      lowp float shininess;
    };

    struct MaterialColor {
      lowp vec3 ambient;
      lowp vec3 diffuse;
      lowp vec3 specular;
    };
  
    struct PointLight {
      lowp vec3 position;

      lowp vec3 color;
      lowp vec4 intensity;
    };

    uniform PointLight uPointLight[1];

    uniform Material uMaterial;
    
    uniform sampler2D uDiffuseMap;
    
    lowp float gamma = 2.2;

    // It's Blinn-Phong actually.
    lowp vec3 calcPhong(lowp vec3 lightDir, lowp vec3 viewDir) {
      // Diffuse
      lowp float lambertian = max(dot(lightDir, normal), 0.0);

      // Specular
      lowp float spec = 0.0;
      lowp float fresnel = 0.0;
      if (lambertian > 0.0) {
        lowp vec3 halfDir = normalize(lightDir + viewDir);
        lowp float specAngle = max(dot(halfDir, normal), 0.0);

        spec = pow(specAngle, uMaterial.shininess);
        fresnel = pow(1.0 - max(0.0, dot(halfDir, viewDir)), 5.0);
      }

      return vec3(lambertian, spec, fresnel);
    }

    lowp vec3 calcPoint(
      PointLight light, MaterialColor matColor, lowp vec3 viewDir
    ) {
      lowp vec3 lightDir = light.position - fragPos;

      lowp float distance = length(lightDir);
      lightDir = lightDir / distance;

      // Attenuation
      lowp float attenuation = 1.0 / ( 1.0 +
        light.intensity.w * (distance * distance));

      lowp vec3 phong = calcPhong(lightDir, viewDir);

      // Combine everything together
      lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
      result += mix(matColor.specular, vec3(1.0), phong.z) *
        light.intensity.b * phong.y;
      result += matColor.ambient * light.intensity.r;
      result *= attenuation;
      result *= light.color;

      return result;
    }

    void main() {
      fragPos = vPosition;
      lowp vec3 viewDir = normalize(vViewPos - fragPos);
      normal = normalize(vNormal);
  
      lowp vec2 texCoord = vTexCoord;

      MaterialColor matColor;
      matColor.ambient = pow(uMaterial.ambient, vec3(gamma));
      matColor.diffuse = pow(uMaterial.diffuse, vec3(gamma));
      matColor.specular = pow(uMaterial.specular, vec3(gamma));

      lowp vec3 diffuseTex = pow(texture2D(uDiffuseMap, texCoord).xyz, vec3(gamma));
      matColor.ambient *= diffuseTex;
      matColor.diffuse *= diffuseTex;

      lowp vec3 result = vec3(0.0, 0.0, 0.0);

      for (int i = 0; i < 1; ++i) {
        result += calcPoint(uPointLight[i], matColor, viewDir);
      }
      
      gl_FragColor = vec4(pow(result, vec3(1.0 / gamma)), 1.0);
      // gl_FragColor = vec4(result, 1.0);
    }
    `,
    }],
  });
  const boxImg = new Image();
  boxImg.src = textureImg;
  boxEnt.set('texture', new Texture(boxImg));
  boxEnt.set('material', {
    shaderId: boxId,
    uniforms: {
      uMaterial: {
        ambient: '#FFFFFF',
        diffuse: '#FFFFFF',
        specular: [1.0, 1.0, 1.0],
        shininess: 50,
      },
      uPointLight: [{
        position: [5, 10, 0],
        color: [1, 1, 1],
        intensity: [0.3, 0.7, 0.5, 0.001],
      }],
      uDiffuseMap: boxId,
    },
  });
  boxEnt.set('geometry', new Geometry(calcNormals(box())));

  const sphereEnt = entityStore.createEntity({
    geometry: new Geometry(uvSphere(10, 10)),
    material: {
      shaderId: boxId,
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
        uDiffuseMap: boxId,
      },
    },
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
