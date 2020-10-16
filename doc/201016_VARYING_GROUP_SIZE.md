# Varying Group Size
So far, we've been able to implement core logic using group containers. This
works - but as we try to add more entities, say - 50k entities, we increase
draw calls linearly. Since each group can only contain 32 entities, this means
we have to make about 1500 draw calls. This is unacceptable.

Instead, we need to increase the group's size to solve this. However, just
increasing group size is not right too - if we have lots of same entity groups,
sure this works, but if we have few entities per each entity group containers,
it'd just waste lots of memory.

This means we have to vary the group size, increasing each group size as
the entity group container gets bigger.

For example, we could use 32, 64, 128, 256, 512, 1024, ... group size.

This should be pretty trivial for entity group side. However, components
currently allocate addresses on the basis that the group size is fixed.

We should probably implement "paging" to solve this, or we'll probably end up
in address fragmentation.

The idea is that we start with a page of 1024 size. This page can be divided to
two 512 size pages, then two 256 size pages, ...

So, if we have a group of 1, and a group of 1024, we'd use 2048 addresses to
just address 1025. However this completely solves memory fragmentation problem,
so I think this is a worthy tradeoff.

As for 50k entities, this means we have to make about 50 draw calls, so it's
acceptable too.

We probably can't handle 1M entities using 1024 pages, but I don't think we'd
go that far anyway due to lack of multithreading.
