/* eslint-disable prefer-destructuring */
import { quat, vec3 } from 'gl-matrix';

const IDENTITY = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0];

interface TransformJSON {
  pos: [number, number, number],
  rotation: [number, number, number, number],
  scale: [number, number, number],
}

function isTransformJSON(value: unknown): value is TransformJSON {
  const obj = value as TransformJSON;
  if (!(Array.isArray(obj.pos)
    && obj.pos.length === 3
    && obj.pos.every((v) => typeof v === 'number'))) return false;
  if (!(Array.isArray(obj.rotation)
    && obj.rotation.length === 4
    && obj.rotation.every((v) => typeof v === 'number'))) return false;
  if (!(Array.isArray(obj.scale)
    && obj.scale.length === 3
    && obj.scale.every((v) => typeof v === 'number'))) return false;
  return true;
}

export class Transform {
  // rawArray is composed of:
  // - position x, y, z, w
  // - quaternion x, y, z, w
  // - scale x, y, z, w
  // Position, scale's w value is ignored.
  rawArray: Float32Array;

  constructor(rawArray?: Float32Array) {
    this.rawArray = rawArray || new Float32Array(IDENTITY);
  }

  getPosition(): Float32Array {
    return this.rawArray.subarray(0, 3);
  }

  getRotation(): Float32Array {
    return this.rawArray.subarray(4, 8);
  }

  getScale(): Float32Array {
    return this.rawArray.subarray(8, 11);
  }

  get position(): Float32Array {
    return this.rawArray.subarray(0, 3);
  }

  get rotation(): Float32Array {
    return this.rawArray.subarray(4, 8);
  }

  get scale(): Float32Array {
    return this.rawArray.subarray(8, 11);
  }

  translate(input: vec3): void {
    const output = this.getPosition();
    vec3.add(output, output, input);
  }

  setPosition(input: vec3): void {
    const output = this.getPosition();
    vec3.copy(output, input);
  }

  setRotation(input: quat): void {
    const output = this.getRotation();
    quat.copy(output, input);
  }

  setScale(input: vec3): void {
    const output = this.getScale();
    vec3.copy(output, input);
  }

  rotate(input: quat): void {
    const output = this.getRotation();
    quat.mul(output, output, input);
  }

  rotateXYZ(x: number, y: number, z: number): void {
    const output = this.getRotation();
    quat.rotateY(output, output, y);
    quat.rotateX(output, output, x);
    quat.rotateZ(output, output, z);
  }

  lookAt(target: vec3, up: vec3): void {
    const pos = this.getPosition();
    const output = this.getRotation();
    const diff = vec3.create();
    const cross = vec3.create();
    vec3.subtract(diff, pos, target);
    vec3.normalize(diff, diff);
    vec3.cross(cross, up, diff);
    vec3.normalize(cross, cross);
    const newUp = vec3.create();
    vec3.cross(newUp, diff, cross);
    quat.fromMat3(output, [
      cross[0], cross[1], cross[2],
      newUp[0], newUp[1], newUp[2],
      diff[0], diff[1], diff[2],
    ]);
  }

  toJSON(): TransformJSON {
    const { rawArray: a } = this;
    return {
      pos: [a[0], a[1], a[2]],
      rotation: [a[8], a[9], a[10], a[11]],
      scale: [a[4], a[5], a[6]],
    };
  }

  static fromJSON(data: unknown): Transform {
    if (!isTransformJSON(data)) {
      throw new Error('Invalid JSON');
    }
    return new Transform(new Float32Array([
      data.pos[0],
      data.pos[1],
      data.pos[2],
      0,
      data.rotation[0],
      data.rotation[1],
      data.rotation[2],
      data.rotation[3],
      data.scale[0],
      data.scale[1],
      data.scale[2],
      0,
    ]));
  }
}
