import { quat, vec3 } from 'gl-matrix';

import { BlenderControllerTarget } from './BlenderControllerTarget';
import { Transform } from '../render/Transform';
import {
  Component,
  EntityStore,
  EntityGroup,
  Entity,
} from '../core';

export class BlenderControllerSystem {
  entityStore: EntityStore;

  canvas: HTMLCanvasElement;

  targets: number[];

  targetComponent: Component<BlenderControllerTarget>;

  enabled = false;

  lastX = 0;

  lastY = 0;

  constructor(
    store: EntityStore,
    canvas: HTMLCanvasElement,
  ) {
    this.entityStore = store;
    this.canvas = canvas;
    this.targets = [];
    this.targetComponent = store
      .getComponent<Component<BlenderControllerTarget>>('blenderController');
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleBlenderControllerChange = this.handleBlenderControllerChange.bind(this);
    this.targetComponent.subscribe(this.handleBlenderControllerChange);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    this.canvas.addEventListener('mousedown', this.handleMouseDown);
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  }

  handleBlenderControllerChange(
    group: EntityGroup,
    start: number,
    size: number,
  ): void {
    for (let i = 0; i < size; i += 1) {
      const entity = this.entityStore.getEntityOfGroup(group, i + start);
      this.updateEntity(entity);
    }
  }

  handleMouseDown(e: MouseEvent): void {
    // Memorize current position;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Register events to the window.
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove(e: MouseEvent): void {
    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Rotate the object with given coordinates; we aim to implement
    // "trackball" style navigation.
    this.targets.forEach((id) => {
      const entity = this.entityStore.getEntity(id);
      if (entity == null) return;
      const transform = entity.get<Transform>('transform');
      const rot = quat.create();
      quat.rotateY(rot, rot, Math.PI / 180 * -deltaX / 4);
      quat.multiply(transform.rotation, rot, transform.rotation);
      quat.rotateX(transform.rotation, transform.rotation,
        Math.PI / 180 * -deltaY / 4);
      this.updateEntity(entity);
    });
  }

  updateEntity(entity: Entity): void {
    const transform = entity.get<Transform>('transform');
    const blenderController = entity.get<BlenderControllerTarget>(
      'blenderController',
    );
    // Move the object according to the rotation
    vec3.transformQuat(
      transform.position,
      [0, 0, blenderController.distance],
      transform.rotation,
    );
    vec3.add(
      transform.position,
      transform.position,
      blenderController.center as [number, number, number],
    );
    entity.markChanged('transform');
  }

  handleMouseUp(): void {
    // Unregister events from the window.
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
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
