# Component Handles
Due to the nature of column-oriented structure, the actual data can be stored
inside the component. For most cases, the component merely stores data as
serializable data - such as object, number, etc. However, for stuff like
LocRotScale, they are largely 'vectorized' - The values are stored in a single
Float32Array. Because of this, instead of storing components directly, it stores
arrays of values and provides "handles" to see the values.

While performance-oriented routines could use the array directly, in most cases
this is quite cumbersome to use and a better method must be provided.

LocRotScale component should accept 'LocRotScale' object, which has two
implementations - one for actual usage, and one for a "view" to the component.

## Do we really need memory locality?
Sure, for components like LocRotScale, Mesh, etc, memory locality is very
important. However, components simply referencing to other buffers are not
possible to ensure memory locality, and copying values only adds complexity.

In this case, we don't have to retain memory locality therefore we can receive
the provided object without copying - we can just replace the reference.
This means that we don't even have to manage offsets, allocations, copying, etc.

So, most performance-oriented, fixed-size components would still use immutable
components and mutable components, but we need 'refComponent' for trivial
stuff.
