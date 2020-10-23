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

