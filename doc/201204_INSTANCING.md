# Instancing
Before we consider the idea of instancing, we must find a way to support
multiple geometries at once. The concept is simple - multiple geometries
can be specified to one draw calls.

However, normal attributes need to have same indices and same size to be shared,
so it shouldn't be easy to merge them. Instancing, on the other hand, is very
simple to implement and does not require any preassumptions.

To allow this, the renderer will support "stacked" geometries - For example,
the "aModel" geometry can be stacked on the top of "aPosition", etc.

The stacked geometry shouldn't use any indices, and the render "count" must be
predetermined to correctly propagate all of this.

Furthermore, since geometries are not bound to any other geometries, parent /
child relationship shouldn't be specified, instead simple instructions to
whether use instancing or not should be passed.

```js
{
  attributes: {
    aModel: {
      data: [...],
      axis: 16,
      instanced: 1,
    },
  },
}
```

Generally, all geometries should be able to support instancing - the renderer
should retrieve how many counts it renders and pass it to another geometry
involved in the rendering.

The 'bottommost' (most frequently updated) geometry should issue the draw call.
In this case, "aModel" geometry is instancing geometry and others are not.

The geometry should support these methods in order to support instancing:

- bind(shaderBuffer: ShaderBuffer, primCount: number = 0): number
- render(primCount: number = 0): void

Basically, bind() function accepts primCount and applies this to
vertexAttribDivisorANGLE if present, and returns new primCount.

If the user wants to supply the geometry along with other geometry, instead of
using 'stacked' instanced geometries, the primCount can be ignored and 0 can be
passed.
