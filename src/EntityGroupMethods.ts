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

export function updateGroupHashCode(group: EntityGroup): void {
  let result = 7;
  let windPos = 0;
  for (let i = 0; i < group.offsets.length; i += 1) {
    if (group.offsets[i] !== -1) {
      for (let j = windPos; j < i; j += 1) {
        result = result * 31 | 0;
      }
      windPos = i;
      result = result * 31 + 1 | 0;
    }
  }
  group.hashCode = result;
}

export function addGroupComponent(
  group: EntityGroup,
  component: Component<unknown>,
): void {
  const { pos } = component;
  if (group.offsets.length > pos && group.offsets[pos] !== -1) return;
  group.offsets[pos] = component.allocate(group.maxSize);
  updateGroupHashCode(group);
}

export function removeGroupComponent(
  group: EntityGroup,
  component: Component<unknown>,
): void {
  const { pos } = component;
  if (group.offsets.length <= pos || group.offsets[pos] === -1) return;
  component.unallocate(group.offsets[pos], group.maxSize);
  group.offsets[pos] = -1;
  updateGroupHashCode(group);
}

export function getGroupComponentOffset(
  group: EntityGroup,
  component: Component<unknown>,
): number | null {
  const { pos } = component;
  if (group.offsets.length <= pos) return -1;
  return group.offsets[pos];
}

export function copyGroupEntity(
  store: EntityStore,
  src: EntityGroup,
  dest: EntityGroup,
  srcIndex: number,
  destIndex: number,
): void {
  for (let i = 0; i < dest.offsets.length; i += 1) {
    const srcOffset = src.offsets[i];
    const destOffset = dest.offsets[i];
    if (srcOffset === -1 || destOffset === -1) continue;
    const component = store.components[i];
    component.array.copyBetween(
      srcOffset + srcIndex,
      destOffset + destIndex,
    );
  }
}
