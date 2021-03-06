import { EntityPage } from './EntityPage';
import { EntityStore } from './EntityStore';
import { Component } from '../components/Component';

// TODO: Fix order of store / group etc

export function getGroupComponentIds(group: EntityPage): number[] {
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
  group: EntityPage,
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
  group: EntityPage,
  store: EntityStore,
): void {
  const hashCode = getGroupContainerHashCode(group.offsets, store);
  group.hashCode = hashCode;
}

export function addGroupComponent<T>(
  group: EntityPage,
  component: Component<T>,
  value: T,
  store: EntityStore,
): number {
  const { pos } = component;
  if (pos == null) throw new Error('Invalid');
  if (group.offsets.length > pos && isAllocated(group.offsets[pos])) {
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
  group: EntityPage,
  component: Component<T>,
  offset: number,
  store: EntityStore,
): void {
  const { pos } = component;
  if (pos == null) return;
  if (group.offsets.length > pos && isAllocated(group.offsets[pos])) return;
  for (let i = group.offsets.length; i < pos; i += 1) {
    group.offsets[i] = -1;
  }
  group.offsets[pos] = component.createOffsetFromOffset(offset, group.maxSize);
  updateGroupHashCode(group, store);
}

export function removeGroupComponent(
  group: EntityPage,
  component: Component<unknown>,
  store: EntityStore,
): void {
  const { pos } = component;
  if (pos == null) return;
  if (group.offsets.length <= pos || !isAllocated(group.offsets[pos])) return;
  component.deleteOffset(group.offsets[pos], group.maxSize);
  group.offsets[pos] = -1;
  updateGroupHashCode(group, store);
}

export function getGroupComponentOffset(
  group: EntityPage,
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
  dest: EntityPage,
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
  src: EntityPage,
  dest: EntityPage,
  srcIndex: number,
  destIndex: number,
): void {
  for (let i = 0; i < dest.offsets.length; i += 1) {
    const srcOffset = src.offsets[i];
    const destOffset = dest.offsets[i];
    if (!isAllocated(srcOffset) || !isAllocated(destOffset)) continue;
    const component = store.components[i];
    if (component.isUnison()) continue;
    component.copyBetween(
      srcOffset + srcIndex,
      destOffset + destIndex,
    );
    component.markChanged(dest, destIndex, 1);
  }
}

export function removeGroupEntity(
  store: EntityStore,
  group: EntityPage,
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
  group: EntityPage,
  store: EntityStore,
): void {
  for (let i = 0; i < group.offsets.length; i += 1) {
    if (isAllocated(group.offsets[i])) {
      const component = store.components[i];
      component.deleteOffset(group.offsets[i], group.maxSize);
      group.offsets[i] = -1;
    }
  }
}

export function toJSONGroupEntity(
  store: EntityStore,
  group: EntityPage,
  index: number,
  mapId?: (id: number | null) => unknown,
): unknown {
  const result: { [key: string]: unknown } = {};
  for (let i = 0; i < group.offsets.length; i += 1) {
    const offset = group.offsets[i];
    if (isAllocated(offset)) {
      const component = store.components[i];
      const value = component.get(offset + index);
      result[component.name!] = component.toJSON(value, mapId);
    }
  }
  return result;
}
