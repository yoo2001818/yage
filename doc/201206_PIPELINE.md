# Rendering Pipeline
For now, we can issue draw calls using textures and stuff. However, we need to
make a rendering pipeline to support both deferred and forward rendering,
post processing, shadows, etc.

To do that, we need to separate mesh phase and lighting phase. In order to do
forward rendering, the mesh shader and the lighting shader will be merged
and called. To do deferred rendering, these data will be separated to textures
and lighting pass will be done separately.

Basically, we need a way to dynamically recompile the shader to tailor to the
requirements.

The material, the lighting both should contain a shader. The material should
be able to specify instructions to render itself - whether if deferred rendering
is allowed, depth buffer is used or not, etc.

However, deferred shading requires the material to not use any blending mode
or stuff. So using any one of them will make the material to use forward
rendering.

We need a proper descriptor for describing the material! However, the material
itself is an adjustment instance for a shader, therefore the shader needs to
specify how the mesh should be rendered.

Basically, we'd end up something like this:

```js
{
  type: 'combined',
  shadow: false,
  passes: [{
    cull: 'back',
    depthTest: 'less',
    vert: '...',
    frag: `
      varying vec4 uNormal;

      void main(inout MaterialSpec spec) {
        spec.normal = uNormal;
      }
    `,
  }]
}

{
  type: 'forward',
  passes: [{
    type: 'base',
    blend: 'alpha',
    vert: '...',
    // Note that we can't pass lighting information to here! The lighting logic
    // is "fixed" - it must be specified by the shader.
    // This specifies what lights the shader is interested in.
    lighting: {
      point: 2,
    },
    frag: `
      uniform PointLightSpec uPointLights[2];
      // The function vec4 stdCalcPointLight(inout MaterialSpec spec);
      // is present; the forward shader may opt to use this
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `,
  }],
}
```

However, this means that the actual "shader" object and pipeline shader is
separated - we need to manage internal shader instances, which is derived from
shader, created by the pipeline.
