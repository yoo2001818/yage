export interface GeometryAttribute {
  data: number[] | number[][] | Float32Array,
  axis: number,
  stride?: number | null,
  offset?: number | null,
  instanced?: number | null,
}

export interface GeometryDescriptor {
  attributes: { [key: string]: GeometryAttribute | number[][] },
  indices?: number[] | Uint16Array | null,
  mode?: number,
}

export const POINTS = 0;
export const LINES = 1;
export const LINE_LOOP = 2;
export const LINE_STRIP = 3;
export const TRIANGLES = 4;
export const TRIANGLE_STRIP = 5;
export const TRIANGLE_FAN = 6;
