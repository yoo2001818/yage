import { Texture } from '../Texture';

export class TextureBuffer {
  gl: WebGLRenderingContext;

  texture: WebGLTexture | null = null;

  version: number = -1;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  sync(texture: Texture): void {
    const { gl } = this;
    if (texture.version === this.version) return;
    if (this.texture == null) {
      this.texture = gl.createTexture()!;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    if (texture.source != null) {
      const { source } = texture;
      if (source instanceof HTMLImageElement) {
        if (source.loading) return;
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        this.version = texture.version;
      }
    }
  }
}
