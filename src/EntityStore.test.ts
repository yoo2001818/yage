import { EntityStore } from './EntityStore';
import { BaseComponentArray } from './ComponentArray';

describe('EntityStore', () => {
  it('should be able to create entities', () => {
    const store = new EntityStore();
    store.addComponent('position', new BaseComponentArray(() => [0, 0, 0]));
    // Create new entity with position component
    const entity = store.createEntity();
    expect(entity.has('position')).toBe(false);
    entity.add('position');
    // We must have position now... replace it
    expect(entity.has('position')).toBe(true);
    entity.copyFrom('position', [0, 0, 5]);
    expect(entity.get('position')).toEqual([0, 0, 5]);
    expect(entity.size).toBe(1);
  });
  it('should be able to distinguish entities using ID', () => {
    const store = new EntityStore();
    const entity = store.createEntity();
    expect(entity.has('id')).toBe(true);
    expect(typeof entity.get('id')).toBe('number');
    // Each entity gets an ID, and the ID should be start from 0, incrementing
    // by 1 whenever an entity gets added.
    expect(entity.get('id')).toBe(0);
    // Create new entity to check its ID
    expect(store.createEntity().get('id')).toBe(1);
  });
  it('should be able to float/unfloat entities', () => {
    const store = new EntityStore();
    store.addComponent('position', new BaseComponentArray(() => [0, 0, 0]));
    // Create new entity with position component
    const entity = store.createEntity();
    entity.add('position');
    entity.copyFrom('position', [0, 0, 5]);
    // Then unfloat it. This should return resulting entity group handle and
    // index.
    const [target, index] = store.unfloatEntity(entity);
    expect(target.size).toBe(1);
    expect(index).toBe(0);
    expect(target.get('position', 0)).toEqual([0, 0, 5]);
  });
});