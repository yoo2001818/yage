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


