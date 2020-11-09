export class Geometry {
  buffers: { [key: string]: Float32Array } = {};

  buffersChanged: { [key: string]: boolean } = {};

  constructor() {
    this.buffers = {};
    this.buffersChanged = {};
  }
}
