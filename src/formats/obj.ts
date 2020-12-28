export function parseObj(input: string): unknown[] {
  input.split('\n').forEach((line) => {
    if (line[0] === '#') return;
    const words = line.split(/\s+/g);
    // o -> Object
    // v -> aPosition
    // vt -> aTexCoord
    // vn -> aNormal
    // vp -> Not sure
    // f -> Indices
    // mtllib
    // usemtl
    // s off -> Normal smoothing
  });
}
