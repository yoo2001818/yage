import { EntityGroup } from './EntityGroup';
import { EntityStore } from './EntityStore';
import { Component } from '../components/Component';

// TODO: Fix order of store / group etc

export function getGroupComponentIds(group: EntityGroup): number[] {
  const output: number[] = [];
  for (let i = 0; i < group.offsets.length; i += 1) {
    if (group.offsets[i] !== -1) {
      output.push(i);
    }
  }
  return output;
}

export function isAllocated(value: number | undefined | null): boolean {
  return value != null && value !== -1;
}

export function getGroupComponents(
  group: EntityGroup,
  store: EntityStore,
): Component<unknown>[] {
  const ids = getGroupComponentIds(group);
  return ids.map((id) => store.components[id]);
}

export function getGroupContainerHashCode(
  components: number[],
  store: EntityStore,
): number {
  let result = 7;
  let windPos = 0;
  for (let i = 0; i < components.length; i += 1) {
    const offset = components[i];
    if (isAllocated(offset)) {
      const component = store.components[i];
      for (let j = windPos; j < i; j += 1) {
        result = result * 31 | 0;
      }
      windPos = i;
      result = result * 31 + component.getOffsetHash(offset) | 0;
    }
  }
  return result;
}

export function updateGroupHashCode(
  group: EntityGroup,
  store: EntityStore,
): void {
  const hashCode = getGroupContainerHashCode(group.offsets, store);
  group.hashCode = hashCode;
}

export function addGroupComponent<T>(
  group: EntityGroup,
  component: Component<T>,
  value: T,
  store: EntityStore,
): number {
  const { pos } = component;
  if (pos == null) throw new Error('Invalid');
  if (group.offsets.length > pos && group.offsets[pos] !== -1) {
    return group.offsets[pos];
  }
  for (let i = group.offsets.length; i < pos; i += 1) {
    group.offsets[i] = -1;
  }
  group.offsets[pos] = component.createOffset(value, group.maxSize);
  updateGroupHashCode(group, store);
  return group.offsets[pos];
}

export function addGroupComponentFromOffset<T>(
  group: EntityGroup,
  component: Component<T>,
  offset: number,
  store: EntityStore,
): void {
  const { pos } = component;
  if (pos == null) return;
  if (group.offsets.length > pos && group.offsets[pos] !== -1) return;
  for (let i = group.offsets.length; i < pos; i += 1) {
    group.offsets[i] = -1;
  }
  group.offsets[pos] = component.createOffsetFromOffset(offset, group.maxSize);
  updateGroupHashCode(group, store);
}

export function removeGroupComponent(
  group: EntityGroup,
  component: Component<unknown>,
  store: EntityStore,
): void {
  const { pos } = component;
  if (pos == null) return;
  if (group.offsets.length <= pos || group.offsets[pos] === -1) return;
  component.deleteOffset(group.offsets[pos], group.maxSize);
  group.offsets[pos] = -1;
  updateGroupHashCode(group, store);
}

export function getGroupComponentOffset(
  group: EntityGroup,
  component: Component<unknown>,
): number {
  const { pos } = component;
  if (group.offsets.length <= pos!) return -1;
  const offset = group.offsets[pos!];
  if (offset == null) return -1;
  return offset;
}

export function copyGroupComponents(
  store: EntityStore,
  offsets: number[],
  dest: EntityGroup,
): void {
  for (let i = 0; i < offsets.length; i += 1) {
    const srcOffset = offsets[i];
    if (isAllocated(srcOffset)) {
      addGroupComponentFromOffset(dest, store.components[i], srcOffset, store);
    }
  }
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
    if (component.isUnison()) continue;
    component.copyBetween(
      srcOffset + srcIndex,
      destOffset + destIndex,
    );
  }
}

export function removeGroupEntity(
  store: EntityStore,
  group: EntityGroup,
  index: number,
): void {
  // Removes the entity from the entity group. This works by moving last
  // entity to the provided index, and decrementing the size of the group -
  // Therefore the provided entity will be 'overwritten'.
  if (index !== group.size - 1) {
    copyGroupEntity(
      store,
      group,
      group,
      group.size - 1,
      index,
    );
  }
  group.size -= 1;
}

export function unallocateGroup(
  group: EntityGroup,
  store: EntityStore,
): void {
  for (let i = 0; i < group.offsets.length; i += 1) {
    if (group.offsets[i] !== -1) {
      const component = store.components[i];
      component.deleteOffset(group.offsets[i], group.maxSize);
      group.offsets[i] = -1;
    }
  }
}
