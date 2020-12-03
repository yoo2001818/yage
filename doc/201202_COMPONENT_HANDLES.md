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

## Initialization and trash values
Currently, we have 'add' and 'set' method separately. Unfortunately, 'add'
method does not correctly clean up previous values - it just allocates them.

To solve this problem, the users can be told to ensure that 'add' and
initialization are done together, or initialization routine can be specified
in the component, or we can get rid of 'add' altogether.

If we remove 'add', this makes unison component to be hidden from user's scope -
all the manipulation can be done without special treatment - which is good. 

However, the user still should be able to retrieve 'identity' value to 
initialize the component.

## The separation of views, value, and component
The conclusion can be made at this point: We need to separate everything.

The components can fall into one of these categories:

- Highly vectorized components, utilizing Float32Array and so forth. These
  components need to manage its data using "pages", allocating small parts of
  it to each entity. While their internal buffer can be Float32Array or any
  other arrays, it's not easy to interface with it.
- Non-vectorized, but fixed size components. This can be characterized by
  having fixed number of primitives, such as numbers and booleans. While it can
  be initialized as whole to maximize memory locality, any sub-structs or
  strings, arrays will break this assumption therefore become useless.
  When external values are entered, its values are copied to internal values to
  copy by value, instead of copy by reference.
- Non-vectorized components which are fully dynamic therefore any
  pre-allocation optimizations become useless.

"Vectorized" components store their values inside a larger array internally, so
to provided better APIs, a "view" object needs to be given to the user which
references / manipulates the array.

Non-vectorized components don't need such a thing, but still, copying method
and initialization method still needs to be provided.

## What do we need?
First, the components will be separated to:

- MutableComponent
- ImmutableComponent
- UnisonComponent
- Float32ArrayComponent

... Which is EXACTLY same as what we have right now! Still...

MutableComponent would require 'copy' and 'create' function, as it must be built
by the allocator.

ImmutableComponent will require nothing, not even copy or create, as it simply
accepts the value provided from the user.

UnisonComponent will require 'compare' - or 'hash' function, to calculate
corresponding hash object.

Float32ArrayComponent is very, very complicated - it would require size of
each entity, a method to create a 'view' object, a method to copy from 'view'
object to another 'view' object.

Basically, for vectorized components, we need two separate implementations
for it - one that stores vectors by itself, one that stores vectors inside the
component.

## Checking if the component is compatiable
Currently, calculating if the entity's shape is compatiable with each other...
is hard coded. That is, the entity logic itself does everything now - from
calculating hash, comparing, etc.

However, since unison component exist, this should be no longer the case. While
the entity groups are still processed using "offsets", it should be understood
as simple key-value store! The components can provide these methods:

- createOffset(value: T, size: number): number
- deleteOffset(offset: number, size: number): void
- getOffsetHash(offset: number): number
- isOffsetCompatible(a: number, b: number): boolean

The 'createOffset' function merges 'allocate', 'getUnisonOffset' functions
together. 'getOffsetHash', 'isOffsetCompatible' can be used by entity logics
to determine the corresponding entity group. Using this, 'unison' is no longer
needed!
