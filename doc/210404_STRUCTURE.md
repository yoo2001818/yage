# Structure
Since it's been a while, and the refactoring needs to be performed, I seriously
need to rethink about the structure. However this needs a draft document -
I can't write specification test code out of thin air.

The store contains:
- a list of ComponentContainer
- a list of EntityClass
- a list of Entity

The ComponentContainer receives and manages all the component allocation /
unallocation. It can be selected to operate in one of these three methods:
- Array mode. An EntityPage receives an offset to the array. This greatly
  improves the performance of batch processing.
- Unison mode. Each Entity calculates hash code to find the specific value;
  then the Entity gets assigned to the matching EntityPage. This is used to
  quickly merge the Entity with the same shape / type, so they can be bulk
  processed, for example instancing can be applied.
- Independent mode. Each Entity has a Map object containing all the interim
  components. The ComponentContainer does nothing in this case. This can be
  utilized when the performance is not important or it can't benefit from
  cache efficiency. For example, geometries or shaders are too large to benefit
  from caches, furthermore it'll suffer from relocation since the payload is
  too large.
- If the component is not used for searching entities, it can be
  just dropped. This makes the component dynamically attachable without harming
  any performance, so it can be used to build an index.

The EntityClass contains the list of EntityPage with same signature. It manages
EntityPage of its own - the scaling policy, etc, is all managed by each class.

The EntityPage contains the list of Entity. However, the EntityPage directly
manages the offset of each ComponentContainer - so, if bulk processing is
required, they can be used in here. it also contains the "lock" bitset which is
used to determine if an Entity in the given offset is "locked" - the signature
differs from the original EntityPage's type and should be ignored.

The "lock" bit exists to remove unnecessary memory relocation, which is major
overhead when changing entities. The batch processing, etc, all ignore an entity
with "lock" bit set. However the locked entity needs to be processed, so the
EntityPage reports to EntityClass that it contains locked entity which needs to
be processed separately.

The entity can freely move between pages, classes, however it may reside within
non-matching entity type. This will be processed on each end of the tick (or when
the game is not busy enough)

## The Entity Identity
EntityClass, EntityPage, Entity uses an array filled with numbers to check
its identity. This is in fact very crucial for the operation of page based
entity management.

We also need to compare these numbers quickly enough to determine if the
EntityClass / EntityPage / Entity belongs to certain pattern.

To enable all of this, we can use a "hash code" function to quickly determine
which entity is which.

## The Entity Allocation Process
When the entity gets created, it has an identity array to determine the slot.
The store is required to use this information to correctly place the entity in
a page.

1. Determine which class it belongs to. Use hash code when necessary.
2. If it doesn't exist, create one.
3. The class creates a new page, or uses the previous page.
4. The page increases its size by 1.

## The Component Container
The ComponentContainer class handles data management, including hashCode or
getters, setters. If the entity's data only reside in the entity, it'd be pretty
simple.

However, there is a concept of EntityPage, which pretty much complicates
everything.

Basically, the entity's data can freely move around - between entity and
pages - and the ComponentContainer must be aware of it in order to utilize
the page's information.

However, it'd be simple enough to implement that, since the ComponentContainer
manages the data storage on its own, nothing else really interferes with it.

The ComponentContainer can instead opt to store everything in the Entity. This
is completely fine - it can just ignore "move" requests and store everything in
the Entity.

If the ComponentContainer opt to utilize EntityPage, it must do the following:

- When performing get, set, has, delete...
  - It must look for Entity's data set first, which might be a tuple.
  - If it's undefined, it must proceed to look for EntityPage's data set.
  - If the Entity's data is marked as deleted, it must report the component as
    "not existing" and should not touch EntityPage's data at all.
- It will be often asked to move the values around. Indeed the
  ComponentContainer should move the values from page to entity, or vice versa.

## The "lock" bit
The EntityPage has a "lock" bit that is set whenever the signature of entity
does not conform to the EntityPage's signature.

To calculate this, the EntityPage would have a list of signature returned from
the each component.

## The responsibility
The structure makes that some values are processed through the store, or
some are processed within the entity itself, etc.

This makes it hard to determine which method performs which, but it is not
possible to make everything only do stuff for itself.

Instead, we'd be better to just separate private / public methods.
