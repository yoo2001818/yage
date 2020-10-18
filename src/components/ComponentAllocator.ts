const PAGE_SIZE = 65536;

interface Chunk {
  start: number,
  end: number,
}

export class ComponentAllocator {
  chunks: Chunk[];

  onAllocate: (size: number) => number;

  constructor(
    onAllocate: (size: number) => number,
  ) {
    this.chunks = [];
    this.onAllocate = onAllocate;
  }

  allocate(size: number): number {
    // We could sort the chunks in size order, but let's resort to full scan
    // for now.
    let chunkIndex = this.chunks.findIndex((v) => v.end - v.start >= size);
    let chunk: Chunk;
    if (chunkIndex === -1) {
      // There is no chunk available. Let's request for more...
      const allocated = this.onAllocate(PAGE_SIZE);
      chunk = { start: allocated, end: allocated + PAGE_SIZE };
      this.chunks.push(chunk);
      chunkIndex = this.chunks.length - 1;
    } else {
      chunk = this.chunks[chunkIndex];
    }
    // Slice the chunk at the beginning of the list.
    const current = chunk.start;
    chunk.start += size;
    if (chunk.start === chunk.end) {
      // If the chunk becomes empty, remove the chunk.
      this.chunks.splice(chunkIndex, 1);
    }
    return current;
  }

  unallocate(offset: number, size: number): void {
    // First, create a chunk using the offset and try to merge them together.
    const chunk = { start: offset, end: offset + size };
    // Then, we need to find where it belongs to. Since we've got a sorted list,
    // a binary search is possible.
    let pos = 0;
    {
      let start = 0;
      let end = this.chunks.length;
      while (start < end) {
        const mid = (start + end) >> 1;
        const target = this.chunks[mid];
        if (target.start < chunk.start) {
          start = mid;
        } else if (target.start > chunk.start) {
          end = mid;
        } else {
          // What?
          throw new Error('Resource unallocated twice');
        }
      }
      pos = start;
    }
    // So, the chunk belongs in that position!
    // TODO: Implement merging.
    this.chunks.splice(pos, 0, chunk);
  }
}
