export class Geometry {
  buffers: { [key: string]: Float32Array } = {};

  indices: { [key: string]: Uint32Array } = {};

  buffersChanged: { [key: string]: boolean } = {};

  constructor() {
    this.buffers = {};
    this.indices = {};
    this.buffersChanged = {};
  }
}
