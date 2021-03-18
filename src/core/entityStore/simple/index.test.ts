import { SimpleEntityStore } from './SimpleEntityStore';

describe('SimpleEntityStore', () => {
  it('should create and delete entities', () => {
    const store = new SimpleEntityStore();
    const entity = store.create();
    expect(entity.id).toBe(0);
    expect(store.get(entity.id)).toBe(entity);
    store.delete(entity.id);
    expect(store.get(entity.id)).toBe(null);
  });
  it('should reuse ids', () => {
    const store = new SimpleEntityStore();
    const ent1 = store.create();
    store.delete(ent1.id);
    const ent2 = store.create();
    expect(ent2.id).toBe(ent1.id);
  });
  it('should iterate entities', () => {
    const store = new SimpleEntityStore();
    const entities = Array.from({ length: 10 }).map(() => store.create());
    const callbackFn = jest.fn();
    store.forEach(callbackFn);
    expect(callbackFn.mock.calls.map((v) => v[0])).toEqual(entities);
  });
  it('should iterate entities by page', () => {
    const store = new SimpleEntityStore();
    const entities = Array.from({ length: 10 }).map(() => store.create());
    const callbackFn = jest.fn();
    store.forEachPage((page) => page.forEach(callbackFn));
    expect(callbackFn.mock.calls.map((v) => v[0])).toEqual(entities);
  });
});
describe('SimpleEntity', () => {
  it('should manage components', () => {
    const store = new SimpleEntityStore();
    const entity = store.create();
    entity.set('name', 'Hello');
    expect(entity.has('name')).toBe(true);
    expect(entity.get('name')).toBe('Hello');
    expect(entity.toObject()).toEqual({ name: 'Hello' });
    entity.delete('name');
    expect(entity.has('name')).toBe(false);
    expect(() => entity.get('name')).toThrow();
    expect(entity.toObject()).toEqual({});
    entity.fromObject({ name: 'HelloAgain', x: 3 });
    expect(entity.get('name')).toBe('HelloAgain');
    expect(entity.get('x')).toBe(3);
  });
});
describe('SimpleEntityQuery', () => {
  it('should filter out entities', () => {
    const store = new SimpleEntityStore();
    const entity1 = store.create();
    entity1.set('name', 'A');
    entity1.set('x', 5);
    const entity2 = store.create();
    entity2.set('name', 'B');
    const entity3 = store.create();
    entity3.set('x', 5);
    const query = store.query();
    query.withComponents('name', 'x');
    const callbackFn = jest.fn();
    query.forEach(callbackFn);
    expect(callbackFn.mock.calls).toEqual([[entity1]]);
  });
});
