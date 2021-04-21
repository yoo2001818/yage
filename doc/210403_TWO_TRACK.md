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

## Going further
Each entity page retrieves an offset of given size. Instead of doing this, we
can just provide EntityPage sized array and put it directly inside EntityPage.

Still, in this case, we have problem about which class actually stores the data.
For simple mode, the component itself should store the information.
For paged mode, the offset can be stored, or the page itself can store the
information.

When the game logic wants to use the data outside the entity, it needs to be
initialized with its own storage unit.

It means, like a buffer object, the component object only acts as a pointer;
the data can be stored anywhere else. The component therefore must provide
various ways to store the data, which can be pretty cumbersome.

However, again, this is only meaningful if all data objects implement it.
Simpler components do not need such a thing and usually it's not worth it.
