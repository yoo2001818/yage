export function convertFloat(value: unknown): number {
  if (Array.isArray(value)) return value[0] as number;
  if (value instanceof Float32Array) return value[0];
  if (typeof value === 'number') return value;
  throw new Error(`Unexpect value ${value}`);
}

const floatBuf = Array.from({ length: 16 }, (_, i) => new Float32Array(i));

export function convertFloatArray(
  value: unknown,
  size: number,
): Float32Array {
  if (Array.isArray(value)) {
    const buf = floatBuf[size];
    for (let i = 0; i < size; i += 1) {
      buf[i] = value[i];
    }
    return buf;
  }
  if (value instanceof Float32Array) return value;
  throw new Error(`Unexpect value ${value}`);
}

export function convertInt(value: unknown): number {
  if (Array.isArray(value)) return value[0] as number;
  if (value instanceof Float32Array) return value[0];
  if (value instanceof Int32Array) return value[0];
  if (value === true) return 1;
  if (value === false) return 0;
  return value as number;
}

const intBuf = Array.from({ length: 16 }, (_, i) => new Int32Array(i));

export function convertIntArray(
  value: unknown,
  size: number,
): Int32Array {
  if (Array.isArray(value)) {
    const buf = intBuf[size];
    for (let i = 0; i < size; i += 1) {
      buf[i] = value[i];
    }
    return buf;
  }
  if (value instanceof Int32Array) return value;
  throw new Error(`Unexpect value ${value}`);
}
