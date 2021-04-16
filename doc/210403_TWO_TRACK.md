# Separating entities to two tracks
While trying to keep the data close together will work, it is simply not really
feasible in Javascript - Simple numeric arrays, sure, however, more complicated
objects are too large enough and so sparse that this would have no effect
whatsoever.

The example would be materials and textures, shaders - since their size itself
is so large, there is no benefit to manage component allocation, etc.

To improve on this, we can separate entities to maintain two separate types of
components - one still uses index-based components. The other one uses map,
just like regular components.

Using this, we can reduce overhead of maintaining component indices even for
components that are too large.

## Component serialization
In both cases, the ComponentArray object is solely responsible for generating
inner-component objects. It MAY use internal indices to manage them, but
it won't be visible in this case.

This means all JSON serialization, etc, routines are all handled by
ComponentArray itself.

```tsx
interface ComponentArray<T> {
  allocate(size: number): number,
  release(offset: number, size: number): void,

  get(offset: number): T,
  fromJSON(offset: number, value: unknown): T,
  toJSON(offset: number): unknown,
}
```
