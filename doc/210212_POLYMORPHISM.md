# Polymorphism
The game data must be serializable due to its design. It is possible to "inject"
custom logic using polymorphism if it wasn't serializable. However this level
of polymorphism is very much required at this point - For example the geometry
/ mesh can be overriden to implement custom logic, pipeline, etc.

But, in current structure, components doesn't control its data or game logic -
at all - the systems control it.

So, instead of directly placing polymorphic classes onto the entities, we
can introduce a layer of abstraction that assigns "descriptor" of logics that
needed to be performed by the component. The systems will execute this
descriptor instead of being hard-coded to the systems.

While this is good enough, due to indirection it's not possible to specify
serialization fields, or type definitions correctly. So we do need to implement
OOP based polymorphism.

The simplest method would be introducing these logic onto the component
(component container, like ImmutableComponent). The serialization routine
must be provided separately however, but it can correctly provide the systems
with properly populated class objects.
