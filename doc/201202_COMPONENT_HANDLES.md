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

