export class LowShader {
  vertShader: string;

  fragShader: string;

  version: number;

  constructor(vertShader: string, fragShader: string) {
    this.vertShader = vertShader;
    this.fragShader = fragShader;
    this.version = 0;
  }
}
