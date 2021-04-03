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
