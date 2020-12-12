import { RenderSystem } from '../systems/RenderSystem';

export abstract class Pipeline {
  renderSystem: RenderSystem | null = null;

  register(renderSystem: RenderSystem): void {
    this.renderSystem = renderSystem;
  }

  unregister(): void {
    this.renderSystem = null;
  }

  abstract render(): void;
}
