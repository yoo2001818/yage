# Project roadmap
1. Basic data / entity management.
   This is extremely important as all the later code will depend on this. Still,
   there would be few refactoring / revisions to find optimal structure.
   This should include basic concepts like:
   - Entity groups
   - Component registry, component array
   - Floating entity groups
   - Entity ID
2. Systems
   Step 1 implements an interface to manipulate entities. Using this, we can
   actually manipulate entities - yet, we still need an actor to perform this.
   Systems are actors that do manipulations which are executed every tick.
   
   ECS frameworks require a facility to filter entities that match the criteria,
   however we lack it in this stage.
   Still, it's possible to perform this task using full scan. Since a proper
   filtering mechanism incurs a lot of complexity, it'd be fine at this stage.

   We also need to specify the order of systems. This can be done by directly
   specifying before / after dependency sets, or by specifying components to
   read / write. However this is not really necessary at this point though -
   just receive a priority number and sort them.
3. Implement a simple game using what we've written so far
   At this stage, it's possible to store the game state / implement game logic
   using what's written so far. To start, a Pong clone would be great. Rendering
   routine is trivial too - we can use 2D canvas.
   After building Pong clone, it should be possible to transform Pong clone to
   Breakout clone.
4. Serialization
   The game should have a state, and the state can and should be serializable.
   We need to convert internal game state, which is composed of component arrays
   and entity groups (column oriented), to 'row oriented format' which is
   composed of arrays of entities, which contain components. The reverse is
   obviously required as well.
5. Family
   Family is a concept / facility to group entity groups that matches certain
   criteria. We've used full scanning to filter out entities - this can be
   optimized using families.

   Family needs to "observe" how entity groups are moving and update its own
   data. This adds quite a bit of complexity - proper testing should be required.
6. Update mechanism
   When a component's data, or an entity group's structure changes, systems must
   be notified of it. Signals / Events are usually used for this, but this will
   cripple the performance as CPU cache wouldn't be efficiently used.
   Instead, we should be able to track whether if an entity group / component
   has changed using some kind of persistent list. There are many possiblites
   for this - for example, bitsets can be used.
   Then, systems should be able to read this list and update changed data.
   Basically, it's a dirty flag for all entities.
7. General purpose indexing
8. Component array strides
9. Entity hierarchy
10. 3D position (LocRotScale)
11. Basic WebGL renderer
12. Animations
