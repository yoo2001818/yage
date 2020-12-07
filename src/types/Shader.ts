export interface ShaderBlendOptions {
  color: number[],
  equation: number | [number, number],
  func: [number, number] | [[number, number], [number, number]],
}

export interface ShaderOptions {
  blend?: ShaderBlendOptions | false,
  colorMask?: number[],
  depthMask?: boolean,
  cull?: false | number,
  depth?: false | number | { func: number, range: [number, number] },
  dither?: boolean,
  stencil?: false | {
    func: [number, number, number]
    | [[number, number, number], [number, number, number]],
    op: [number, number, number]
    | [[number, number, number], [number, number, number]],
  }
  viewport?: false | [number, number, number, number],
  scissor?: false | [number, number, number, number],
  polygonOffset?: false | [number, number],
}

export interface ForwardShaderPassDescriptor {
  type: 'forward',
  options?: ShaderOptions,
  vert: string,
  frag: string,
}

export interface CombinedShaderPassDescriptor {
  type: 'combined',
  vert: string,
  frag: string,
}

export type ShaderPassDescriptor =
| ForwardShaderPassDescriptor
| CombinedShaderPassDescriptor;

export interface ShaderDescriptor {
  passes: ShaderPassDescriptor[],
}
