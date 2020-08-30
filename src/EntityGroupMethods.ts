import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from './Component';

export function getGroupComponentIds(group: EntityGroup): number[] {
  const output: number[] = [];
  for (let i = 0; i < group.offsets.length; i += 1) {
    if (group.offsets[i] !== -1) {
      output.push(i);
    }
  }
  return output;
}

export function getGroupComponents(
  group: EntityGroup,
  store: EntityStore,
): Component<unknown>[] {
  const ids = getGroupComponentIds(group);
  return ids.map((id) => store.components[id]);
}

export function addGroupComponent(
  group: EntityGroup,
  component: Component<unknown>,
): void {
  const { pos } = component;
  if (group.offsets.length > pos && group.offsets[pos] !== -1) return;
  group.offsets[pos] = component.allocate(group.maxSize);
}

export function removeGroupComponent(
  group: EntityGroup,
  component: Component<unknown>,
): void {
  const { pos } = component;
  if (group.offsets.length <= pos || group.offsets[pos] === -1) return;
  component.unallocate(group.offsets[pos], group.maxSize);
  group.offsets[pos] = -1;
}
