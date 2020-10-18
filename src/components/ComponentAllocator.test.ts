import { ComponentAllocator } from './ComponentAllocator';

describe('ComponentAllocator', () => {
  it('should manage chunks correctly', () => {
    let count = 0;
    const allocator = new ComponentAllocator((size) => {
      count += size;
      return count - size;
    });
    // This should leave us a large chunk
    const addr = allocator.allocate(1);
    expect(allocator.chunks.length).toBe(1);
    // This should leave us one chunk too
    allocator.unallocate(addr, 1);
    expect(allocator.chunks.length).toBe(1);
  });
});
