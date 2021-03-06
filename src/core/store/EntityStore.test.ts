import { EntityStore } from './EntityStore';
import { MutableComponent } from '../components/MutableComponent';

describe('EntityStore', () => {
  it('should be able to create entities', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    // Create new entity with position component
    const entity = store.createEntity();
    expect(entity.has('position')).toBe(false);
    entity.set('position', [0, 0, 0]);
    // We must have position now... replace it
    expect(entity.has('position')).toBe(true);
    entity.set('position', [0, 0, 5]);
    expect(entity.get('position')).toEqual([0, 0, 5]);
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
  /*
  it('should be able to float/unfloat entities', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    // Create new entity with position component
    const entity = store.createEntity();
    entity.add('position');
    entity.set('position', [0, 0, 5]);
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
  */
  it('should be able to handle more than 1 entity group', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    for (let i = 0; i < 100; i += 1) {
      // Create new entity with position component
      const entity = store.createEntity();
      entity.set('position', [0, 0, 5]);
      // Unfloat it many, many times
      // entity.unfloat();
    }
  });
  it('should be able to retrieve entity using its ID', () => {
    const store = new EntityStore();
    const entity = store.createEntity();
    const id = entity.get('id') as number;

    expect(store.getEntity(id)!.get('id')).toBe(id);
  });
  it('should be able to remove components from entity group', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    const entity = store.createEntity();
    entity.set('position', [0, 0, 5]);
    expect(entity.has('position')).toBe(true);
    entity.remove('position');
    expect(entity.has('position')).toBe(false);
  });
  it('should be able to serialize state', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    const entity = store.createEntity();
    entity.set('position', [0, 0, 0]);
    expect(store.toJSON()).toEqual([
      { id: 0, position: [0, 0, 0] },
    ]);
  });
  it('should be able to deserialize state', () => {
    const store = new EntityStore();
    store.addComponent('position', new MutableComponent(() => [0, 0, 0]));
    expect(store.fromJSON([
      { id: 0, position: [5, 0, 0] },
      { id: 1, position: [6, 0, 0] },
    ]));
    expect(store.toJSON()).toEqual([
      { id: 0, position: [5, 0, 0] },
      { id: 1, position: [6, 0, 0] },
    ]);
  });
});
