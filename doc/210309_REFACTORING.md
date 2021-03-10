# Refactoring
At this point, the entity group container / entity group / entity data structure
should be one of many possible representations of entity.

Which means, the entity must be fully abstracted away, including all the data
structures - it should be one of the possible representations.

The indexes can simply store data inside the entity, it'll propagate to the 
whole entity group and it won't have any effect on EntityClass (while it
is considered as a component, it won't be used to calculate hash sum)

- "Standalone" version which doesn't involve any components and stuff, just uses
  entity object to store data
- "Paged" version which involves EntityPage
- "Transaction" version which is a mix between two, which can be used to commit
  to paged version
