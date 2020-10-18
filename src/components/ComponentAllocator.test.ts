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
  it('should manage sandwiched chunks correctly', () => {
    let count = 0;
    const allocator = new ComponentAllocator((size) => {
      count += size;
      return count - size;
    });
    // This should leave us a large chunk
    const addr1 = allocator.allocate(1);
    const addr2 = allocator.allocate(2);
    const addr3 = allocator.allocate(3);
    expect(allocator.chunks.length).toBe(1);
    allocator.unallocate(addr2, 2);
    expect(allocator.chunks.length).toBe(2);
    allocator.unallocate(addr1, 1);
    expect(allocator.chunks.length).toBe(2);
    allocator.unallocate(addr3, 3);
    expect(allocator.chunks.length).toBe(1);
  });
});
