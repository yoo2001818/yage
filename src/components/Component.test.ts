import { MutableComponent } from './MutableComponent';

describe.each([
  [
    'MutableComponent',
    () => new MutableComponent(
      () => ({ value: 'a' }),
      (from, to) => { to.value = from.value; },
    ),
  ],
])('%s', (_, create) => {
  it('should be able to maintain values', () => {
    const array = create();
    expect(() => array.get(0)).toThrow();
    expect(array.size).toBe(0);
    array.allocate(32);
    expect(array.size).toBe(32);

    array.get(3).value = 'abcd';
    expect(array.get(3).value).toBe('abcd');
  });
  it('should be able to copy from/to values', () => {
    const array = create();
    array.allocate(1);

    array.set(0, { value: 'a' });
    const result = { value: '' };
    array.copyTo(0, result);
    expect(result.value).toBe('a');
  });
});
