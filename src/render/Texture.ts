export interface TextureConfig {
  width: number | null,
  height: number | null,
}

export class Texture {
  source: null | HTMLImageElement | HTMLVideoElement;

  config: TextureConfig;

  version: number;

  constructor(
    source: null | HTMLImageElement | HTMLVideoElement,
    config: TextureConfig = { width: null, height: null },
  ) {
    this.source = source;
    this.config = config;
    this.version = 0;
  }

  setSource(source: null | HTMLImageElement | HTMLVideoElement): void {
    this.source = source;
    this.version += 1;
  }
}
