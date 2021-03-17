import { SimpleEntityStore } from './SimpleEntityStore';

describe('SimpleEntityStore', () => {
  it('should create entities', () => {
    const store = new SimpleEntityStore();
    const entity = store.create();
    expect(entity.id).toBe(0);
    expect(store.get(entity.id)).toBe(entity);
  });
});
