import { Component } from '../components/Component';
import { EntityStore } from '../store/EntityStore';
import { BlenderControllerTarget } from './BlenderControllerTarget';

export class BlenderControllerSystem {
  entityStore: EntityStore;

  canvas: HTMLCanvasElement;

  targets: number[];

  targetComponent: Component<BlenderControllerTarget>;

  enabled = false;

  constructor(
    store: EntityStore,
    canvas: HTMLCanvasElement,
  ) {
    this.entityStore = store;
    this.canvas = canvas;
    this.targets = [];
    this.targetComponent = store
      .getComponent<Component<BlenderControllerTarget>>('blenderController');
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
  }

  update(): void {
    // Check if any target is present. If it does - attach the
    // event listener to it.

    // TODO: Make this more performant?
    this.targets = [];
    this.entityStore.forEachWith([this.targetComponent], (entity, target) => {
      if (target != null) {
        this.targets.push(entity.id);
      }
    });

    if (this.targets.length > 0) {
      this.enable();
    } else {
      this.disable();
    }
  }
}
