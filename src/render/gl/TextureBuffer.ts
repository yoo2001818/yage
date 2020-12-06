import { Texture } from '../Texture';

function isPowerOf2(value: number): boolean {
  return (value & (value - 1)) === 0;
}

export class TextureBuffer {
  gl: WebGLRenderingContext;

  texture: WebGLTexture | null = null;

  version: number = -1;

  created: boolean = false;

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
        if (!source.complete) {
          if (!this.created) {
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              1,
              1,
              0,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              new Uint8Array([128, 128, 128, 255]),
            );
            this.created = true;
          }
          return;
        }
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        // Only generate mipmaps for power of 2
        if (isPowerOf2(source.width) && isPowerOf2(source.height)) {
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        // TODO Mipmapping, apply config, etc
        this.version = texture.version;
      }
    }
  }

  bind(pos: number): void {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + pos);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }
}
