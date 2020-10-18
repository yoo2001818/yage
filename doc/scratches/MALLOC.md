# Memory allocation
We need to build an allocator that supports dynamic sizes! This is essentially
same as memory allocator (malloc), so we'd follow the same structure.

First, we're assigning an offset, not an actual memory address. Therefore
storing chunk metadata in the data array is not possible. The malloc algorithms
usually depend on this to make seeking simple as possible, but we can't do
that.

Instead, we'll need to manage a sorted list of chunks. We could use a binary
tree, but given that the allocator wouldn't manage a lot of chunks, we could
just resort to an array, performing insertion sort every time. This is possible
since the allocator doesn't need to manage already allocated chunks, at all.

## Allocation
When the allocation is requested, the allocator must first scan the preexisting
chunks and check if any preexisting chunk can be used.

To be optimal, the chunks can be sorted by size and we can try to find optimal
size for allocation quickly.

When the chunk exists, the chunk can be "consumed" - the chunk shrinks to
allocate the requested address. If the chunk's size becomes 0, that chunk simply
gets deleted.

If there are no chunk available, we need to request lower layer (or the OS, but
that's not the scope of this) to allocate more addresses. We request a new
"page". Due to the underlying implementation, the "page" cannot be merged
together (the page can be a single Float32Array which cannot be resized)

After a new page is built, a new empty chunk containing the entire page is
registered and used immediately.

## Deallocation
Deallocation gets more complicated because we need to handle merging.
When the adjacent chunks are available, those chunks must be able to be merged.
We especially need to sort the chunks with the address because of this - we need
to find what's on the left/right of the given address.

Well, a new empty chunk with released offset / size are built and merge logics
are performed. After that, the address is available for use in allocation.
