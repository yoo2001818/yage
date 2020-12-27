export function parseIndices(
  indices: number[] | number[][] | Uint16Array,
): Uint16Array {
  if (Array.isArray(indices)) {
    if (Array.isArray(indices[0])) {
      // Flatten it.....
      const output: number[] = [];
      // What the heck
      (indices as number[][])
        .forEach((v) => v.forEach((v2) => output.push(v2)));
      return new Uint16Array(output);
    }
    return new Uint16Array(indices as number[]);
  }
  return indices;
}

export function parseIndicesNumber(
  indices: number[] | number[][] | Uint16Array,
): number[] {
  if (Array.isArray(indices)) {
    if (Array.isArray(indices[0])) {
      // Flatten it.....
      const output: number[] = [];
      // What the heck
      (indices as number[][])
        .forEach((v) => v.forEach((v2) => output.push(v2)));
      return output;
    }
    return indices as number[];
  }
  return Array.from(indices);
}
