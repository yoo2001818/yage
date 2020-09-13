# Indexing
Being an ECS game engine, indexing is absolutely necessary yet very tricky to
implement. It's because we have to maintain CPU cache efficiency - we shouldn't
do anything else while doing something.

Sadly, this means that we have to do indexing later - but at least
we need to know a way to determine 'which' entity has changed. We need some
kind of marking changed blocks.

But, that'd incur a lot of overhead too - we need to store a list of IDs for
each component, and we need to traverse them too. Even if we use skipping list,
bitset, or binary tree, this cost can be very costful.

- We can use skipping list or binary tree, but if there are a lot of entities
  changing at once, its overhead would be unbearable (you're creating a tree
  with like 1M entries every frame)
- We can use bitset. But that requires a bit for every entity, so 1M entities
  would require 125KB for single index. Which is not too bad actually.
  However, we do need to traverse all of them every frame.
- We can add each flag for each entity group, yet this will be expensive too.

Instead, we can work on the data right after the entity changes. This gives
no penalty if CPU cache did not exist - however CPU cache do exist and it can
reduce performance as it needs to access multiple data for every entity.

However, considering that we bulk-process each entity groups, with each
containing 32 entities, this would be not so bad - it gives much better
programming interface and flexibility. Furthermore, after processing a single
entity group, the program moves on to next group. Since we can't guarantee
two entity group's data is close to each other, this would give no penalty
after all.

If indexing process is simple enough this makes sense, but for complicated
indexes which requires significant overhead, it'd be better to manage
'dirty bit' for each entity. This is usually the case for MVP matrix
calculation, geometry calculation, etc, where each indexed value is independent
to each other (a cache).

But, for indexes like quadtree, BSP, or anything that needs to be sorted, this
is not possible. In this case, we can use both dirty bit and list to prevent
deduplication in the list.

We can conclude that every index requires different approach and we should just
provided an interface to "plug" each index.

Hence, we resolve this by adding 'markChanged', or 'update' function to
each component. After changing entity's component, the component must be
notified of it using 'markChanged'. Then, the indexes attached to that
particular component can be notified of it.

So, it'd be something like this:

```js
const engine = new Engine();
engine.addComponent('pos', new PositionComponent());
engine.addIndex('quadtree', new QuadTreeIndex('pos'));

engine.addSystem(() => {
  const pos = engine.getComponent('pos');
  return () => {
    engine.forEachGroup([pos], (id, size, posOffset) => {
      for (let i = 0; i < size; i += 1) {
        pos.get(i + posOffset)[0] += 1;
      }
      pos.markChanged(id);
    });
  };
});
```

Note that we don't maintain dirty flag from component's side - each index
manages each own dirty flags. This workarounds 'versioning dirty flags' problem
which is very tricky to solve.

However, instead of submitting posOffset, we're sending out entity group IDs.
This is necessary as entity group ID is required to find other corresponding
components, however, it's kind of weird.

But I don't think there is any better way to do this - so let's go on with it!

... I originally wrote array-logic in ComponentArray, and engine-specific logic
in Component. But, if we're gonna put these kind of logic in here, it'd be 
better to just separate it...
