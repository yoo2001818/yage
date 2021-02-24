# Entity Handles
Currently, Entity is meant to be used as a handle to point an entity, which
should point to specific group / index.
However, due to the design of the engine, the entity's actual data freely moves
around.

We need a facility to map between two, without noticeable performance penalty.

