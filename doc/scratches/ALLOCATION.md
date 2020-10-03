# Entity group allocation

- EntityStore
  - EntityGroup
  - EntityGroupContainer
    - EntityGroup

While the EntityStore is still responsible for managing IDs of EntityGroup (and
actual allocation for it), the EntityGroupContainer takes some responsiblity of
managing EntityGroups of same type.

Other than floating EntityGroups, each group must reside in EntityGroupContainer.
The EntityGroupContainer must manage its own EntityGroup - from allocation to
deallocation and iterating. However, to actually create / destroy EntityGroups,
the EntityStore must be notified of it. Therefore the EntityGroupContainer must
have reference to EntityStore.

The concept of 'entity' does not exist in the engine structure - the entity
simply points to the EntityGroup and the index of it. Since we don't even have
to have actual instance of EntityGroup and just go with the ID of EntityGroup,
two integers are sufficient to point to the entity.
However, this reference keeps changing whenever the signature of the entity
changes. We need a facility to map between 'logical' ID and 'physical' ID.

## .create()
Enough said, so, how are we actually going to create an entity?
An entity must allocate 1 slot in EntityGroup. If there are any non-full
EntityGroup with matching type, we can go ahead and just use it.

However, since the signature is fixed, it must know the signature of entity
ahead-of-time. To work around this, we have concept of 'floating' entities.

Well, anyway, if we know signature, the process would be the following:

1. The EntityStore determines the EntityGroupContainer with the same signature.
2. The EntityGroupContainer checks if there is any non-full (available)
   EntityGroup. If so, allocate it. Check if it's full now, and delete from
   'full' list.
3. If there were none, the EntityGroupContainer must create new EntityGroup.
   The EntityStore is called to create new entity group - it tries to reuse
   "dead" EntityGroup if there are any available. Otherwise, it'll create one
   and attach ID and add it to the list.
4. The EntityGroupContainer "claims" the EntityGroup by marking the parent ID of
   the EntityGroup with its own ID.
5. Add it to "non-full" list, and return the freshly created entity group.

## .destroy()
To delete an entity, it's pretty trivial if we don't have to delete the whole
EntityGroup - we can just decrease size, overwrite last data with current one.

However, if the size becomes 0 and therefore we need to destroy the EntityGroup,
it... becomes cumbersome.

1. The EntityStore gets notified of destroyed EntityGroup, and calls
   EntityGroupContainer associated with it.
2. The EntityGroupContainer can decide to keep the EntityGroup, or destroy it.
