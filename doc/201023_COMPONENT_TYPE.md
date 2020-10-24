# Component Type
Some component needs its entity's group changed when the component's data
changes. Putting in other way - the entity group is determined by component's
data.

We may optimize it by making it immutable and sharing address with other
entity groups with same type. It could work - but there's no need for it for
now.

Instead, we can just calculate checksum of the component whenever it changes,
and relocate it. The component must support comparing and checksumming for
this purpose.

To do that, the entity store and other allocation logics must be aware of
whether if the component can't be expressed with single bit. This means pretty
much refactoring everything, as we communicate by the 'bitset' - there's no
place for storing a specific component's data.

To start, the entity group itself must be able to store component itself,
the entity group container too, and we need to retrieve the component using it.

The component itself must be marked as "unison" type, so that entity group
itself stores the component data as whole, and the entity group container too.

Overall, this would be pretty tricky because we didn't really think this
through.

First, for entity groups, we can just utilize the offsets array. We just have to
assign one offset for one group - probably it should be shared between entity
group containers. The assignment logic should be changed as well, but it
shouldn't be that hard.

The "offset" itself becomes an unique identifier for the data - the component
should manage a reference counted table for determining data as an ID.

The entity group container must change to accompany the offsets array too, as
the entity group container should be able to store component data directly.

The "unison" component uses its offset to calculate its checksum, different from
other component which just uses the offsets array as a bitset.
