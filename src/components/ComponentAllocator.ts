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
    let chunk: Chunk = { start: offset, end: offset + size };
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
          start = mid + 1;
        } else if (target.start > chunk.start) {
          end = mid - 1;
        } else {
          // What?
          throw new Error('Resource unallocated twice');
        }
      }
      pos = start;
    }
    // So, the chunk belongs in that position!
    let shouldAppend = true;
    if (pos > 0) {
      // Try to scan the chunk before that.
      const beforeChunk = this.chunks[pos - 1];
      if (beforeChunk.end === chunk.start) {
        // Merge it.
        shouldAppend = false;
        beforeChunk.end = chunk.end;
        chunk = beforeChunk;
      }
    }
    if (this.chunks.length > pos) {
      // Try to scan the chunk after that.
      const afterChunk = this.chunks[pos];
      if (afterChunk.start === chunk.end) {
        if (shouldAppend) {
          // We could just reuse afterChunk.
          shouldAppend = false;
          afterChunk.start = chunk.start;
        } else {
          // There is beforeChunk already overlapping - so the after chunk must
          // be removed.
          this.chunks.splice(pos, 1);
          chunk.end = afterChunk.end;
        }
      }
    }
    if (shouldAppend) {
      this.chunks.splice(pos, 0, chunk);
    }
  }
}
