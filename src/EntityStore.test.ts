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
    expect(store.createEntity().get('id')).toBeGreaterThan(0);
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
    expect(target.group.maxSize).toBeGreaterThan(1);
    expect(index).toBe(0);
    expect(target.get('position', 0)).toEqual([0, 0, 5]);
    // From this point, the 'entity' should be marked as deleted
    expect(entity.disposed).toBe(true);

    // Float the entity.
    const entity2 = store.floatEntity(target, index);
    expect(entity2.group.maxSize).toBe(1);
  });
  it('should be able to handle more than 1 entity group', () => {
    const store = new EntityStore();
    store.addComponent('position', new BaseComponentArray(() => [0, 0, 0]));
    for (let i = 0; i < 100; i += 1) {
      // Create new entity with position component
      const entity = store.createEntity();
      entity.add('position');
      entity.copyFrom('position', [0, 0, 5]);
      // Unfloat it many, many times
      const [target] = store.unfloatEntity(entity);
      expect(target.size).toBeLessThanOrEqual(target.group.maxSize);
    }
  });
  it('should be able to retrieve entity using its ID', () => {
    const store = new EntityStore();
    const entity = store.createEntity();
    const id = entity.get('id') as number;

    expect(store.getEntity(id)).toEqual([entity, 0]);
  });
  it('should be able to remove components from entity group', () => {
    const store = new EntityStore();
    store.addComponent('position', new BaseComponentArray(() => [0, 0, 0]));
    const entity = store.createEntity();
    entity.add('position');
    expect(entity.has('position')).toBe(true);
    entity.remove('position');
    expect(entity.has('position')).toBe(false);
  });
  it('should be able to serialize state', () => {
    const store = new EntityStore();
    store.addComponent('position', new BaseComponentArray(() => [0, 0, 0]));
    const entity = store.createEntity();
    entity.add('position');
    expect(store.serialize()).toEqual([
      { id: 0, position: [0, 0, 0] },
    ]);
  });
});
