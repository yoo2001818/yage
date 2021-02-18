/* eslint-disable prefer-destructuring */
import { quat, vec3 } from 'gl-matrix';

const IDENTITY = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0];

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

  toJSON(): unknown {
    const { rawArray: a } = this;
    return {
      pos: [a[0], a[1], a[2]],
      scale: [a[4], a[5], a[6]],
      quat: [a[8], a[9], a[10], a[11]],
    };
  }

  fromJSON(data: unknown): Transform {
    
  }
}
