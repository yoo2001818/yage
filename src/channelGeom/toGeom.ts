import {
  GeometryDescriptor,
  ChannelGeometryDescriptor,
} from '../types/Geometry';

import { parseAttribute, flattenBuffer } from '../utils/parseAttribute';
import { parseIndices } from '../utils/parseIndices';

export function toGeom(input: ChannelGeometryDescriptor): GeometryDescriptor {
  const indicesArr: {
    indices: number[],
    data: Float32Array,
    axis: number,
    outData: number[],
  }[] = [];
  let indicesSize = -1;

  let indicesCache = {};
  let vertexCount = 0;

  const outputAttribs: { [key: string]: number[] } = {};
  const outputIndices: number[] = [];
  Object.keys(input.indices).forEach((key) => {
    const attribute = parseAttribute(input.attributes[key]);
    if (attribute == null) {
      throw new Error(`Attribute ${key} does not exist`);
    }
    const indices = parseIndices(input.indices[key]);
    if (indices == null) return;
    outputAttribs[key] = [];
    indicesArr.push({
      indices,
      data: attribute.data,
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
    let key = indicesArr.map(({indices}) => indices[i]).join('/');
    let index = indicesCache[key];
    if (index == null) {
      indicesArr.forEach(({ indices, axis, data, outData }) => {
        let offset = indices[i] * axis;
        if ((offset + axis) > data.length) {
          outData.push(new Float32Array(axis));
        } else {
          outData.push(data.subarray(offset, offset + axis));
        }
      });
      index = indicesCache[key] = vertexCount;
      vertexCount ++;
    }
    outputIndices.push(index);
  }
  return Object.assign({}, input, {
    attributes: parseAttributes(outputAttribs),
    indices: parseIndices(outputIndices)
  });
}
