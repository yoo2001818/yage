import {
  GeometryDescriptor,
  ChannelGeometryDescriptor,
  GeometryAttribute,
} from '../types/Geometry';

import { parseAttribute, flattenBuffer } from '../utils/parseAttribute';
import { parseIndicesNumber } from '../utils/parseIndices';

export function toGeom(input: ChannelGeometryDescriptor): GeometryDescriptor {
  const indicesArr: {
    indices: number[],
    data: Float32Array,
    axis: number,
    outData: number[][],
  }[] = [];
  let indicesSize = -1;

  const indicesCache = new Map<number, number>();
  let vertexCount = 0;

  const outputAttribs: { [key: string]: number[][] } = {};
  const outputIndices: number[] = [];
  Object.keys(input.indices).forEach((key) => {
    const attribute = parseAttribute(input.attributes[key]);
    if (attribute == null) {
      throw new Error(`Attribute ${key} does not exist`);
    }
    const indices = parseIndicesNumber(input.indices[key]);
    if (indices == null) return;
    outputAttribs[key] = [];
    indicesArr.push({
      indices,
      data: flattenBuffer(attribute.data),
      axis: attribute.axis,
      outData: outputAttribs[key],
    });
    // Save indices size if not initialized yet.
    if (indicesSize === -1) {
      indicesSize = indices.length;
    }
    // Verify the indices size.
    if (indices.length !== indicesSize) {
      throw new Error('Indices size does not match');
    }
  });

  // Populate indices array while generating attributes data.
  for (let i = 0; i < indicesSize; i += 1) {
    // Validate cache
    const key = indicesArr.reduce((
      prev,
      { indices },
    ) => indices[i] + prev * indices.length, 0);
    let index = indicesCache.get(key);
    if (index == null) {
      indicesArr.forEach(({
        indices, axis, data, outData,
      }) => {
        const offset = indices[i] * axis;
        if ((offset + axis) > data.length) {
          outData.push(Array.from({ length: axis }, () => 0));
        } else {
          outData.push([...data.subarray(offset, offset + axis)]);
        }
      });
      index = vertexCount;
      indicesCache.set(key, vertexCount);
      vertexCount += 1;
    }
    outputIndices.push(index);
  }
  const parsedAttribs: { [key: string]: GeometryAttribute } = {};
  Object.keys(outputAttribs).forEach((key) => {
    parsedAttribs[key] = parseAttribute(outputAttribs[key]);
  });
  return {
    ...input,
    attributes: parsedAttribs,
    indices: outputIndices,
  };
}
