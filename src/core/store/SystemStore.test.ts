import { SystemStore } from './SystemStore';

describe('SystemStore', () => {
  it('should manage list of systems', () => {
    const store = new SystemStore();
    // While we need to make a complicated version of this, this should
    // suffice for now.
    const fn = jest.fn();
    // Check if fn is called in order
    store.addSystem((e) => fn(1, e));
    store.addSystem((e) => fn(2, e));
    store.run('a');
    expect(fn.mock.calls).toEqual([
      [1, 'a'],
      [2, 'a'],
    ]);
  });
});
