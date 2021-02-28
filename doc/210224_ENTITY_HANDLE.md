# Entity Handles
Currently, Entity is meant to be used as a handle to point an entity, which
should point to specific group / index.
However, due to the design of the engine, the entity's actual data freely moves
around.

We need a facility to map between two, without noticeable performance penalty.

## Separating Entity and EntityHandle
We can implement Entity and EntityHandle separately, where EntityHandle storing
the ID only, and Entity storing actual offset of the entity.

This can be helpful without any performance penalty, however to the user,
the need to differentiate between two can be quite weird.

## Polymorphism
Okay, the thing is that, being an ECS framework, there is rarely a need to
persist the entity as an ID. Every entity referenced from system, essentially
works as an iterator. Therefore forEach's entity can actually return an
iterator, where get(id) can return actual entity linked with ID.

## Entity Lifecycle
The entity borrows one slot from the entity group. Should the entity move, it
copies all the data to another entity group.

To do this, the entity is temporarily moved to "floating" entity group, where
the entity group's properties can freely change.

After doing everything, the entity's data is copied back to the actual entity
group, which is created if necessary.

While the idea of floating entity is good, however it causes unnecessary
overhead since all the entity has to be moved around in order to change.

### TemporaryEntity
The "floating entity" idea can be expanded to "temporary entity". The original
entity group will have "locked" bit set to the position of temporary entity,
locking everything out of it.

The temporary entity will store the differences between original set and
the new set.

Then, after finalizing it, it should find new entity group and copied to it.

This reduces the number of copying every component from 2 to 1, which should
help. The entity group must maintain a bitset of locked entities, however this
is neglible since it'd be extremely small. (256 bytes for largest entity group)
It won't have any cache problems too.
