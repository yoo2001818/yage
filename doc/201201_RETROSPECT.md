# Retrospect while building a renderer
Well, while we lack many, many stuff, but it's now possible to render something
on the screen using components! But there's a lot to fix - there was too many
problems and it generally feels awkward to use. We need to allow for more
features, make it more robust, and revamp the API.

## Entity

- ID component's initial value shouldn't be 0. Since the 'markChanged' gets
  triggered each time the component is changed including allocation, this simply
  makes position 0 unusable. Instead, we need to initialize them to be -1?
- Unison components need to be more throughly tested. There are certain
  circumstances that unison components aren't handled well so an error is
  thrown. The best way would be making non-unison and unison components same,
  but since that is not possible anyway, we should handle every case and add
  more tests.
- We're absolute certain that the component exists - but we need to assert it
  in TypeScript. `entity.get<Something>('name')!` is not really fun to use -
  We need 'get or die' kind of getters instead. Given that we won't really
  randomly access getters, `get` should be non-null and throw an error instead!
- Adding a bundle of components is rather cumbersome. Calling them by name is
  not helping too. The name should be used when it's not possible to use
  component object directly - but we're not doing that for now.
  - We can make a function to generate a bundle of components - so that we can
    just plug renderer components onto the entity store.
  - Something like.... `engine.addComponents(createBundle())`
- We need to manually trigger 'markChanged', yet we're not even sure what we're
  modifying at the moment. Returning Float32Array does not help too.
- We perform copying whenever components are added or moved, but the copying
  method is completely hidden to the components. At this rate we should just use
  immutable components?
- LocRotScale component is really cumbersome to use. It's a "compressed" vector
  of location, rotation, scale. However, this doesn't mean we can't use any
  helper functions. While "optimized" code can use underlying Float32Array
  directly, most of the code shouldn't do that. So, instead of returning
  Float32Array, it should return 'LocRotScale' object which provides all the
  manipulation functions.
- Initialize without giving initial value.... requires an 'identity' value

## Renderer
The renderer certainly needs an improvement too.

- It lacks the ability to specify size, buffer, mode on the geometry. This is
  not acceptable since we definitely need to specify modes.
  - We could use webglue-style geometry directly, but webglue doesn't consider
    the idea of using multiple geometries at the same time. It's not an issue
    though.
- It lacks lights, textures, culling, stencil, etc.
- Lights can be offered as
  an array of uniforms, but given that we're using WebGL 1.0, the light count
  must be melded to the shader. This means that the shader needs to be
  dynamically recompiled according to the light count.
  It's possible! Since we already have this feature in webglue, we can directly
  copy the dynamic manipulation routine.
- Textures, however, may be quite difficult to implement. There are mainly two
  usages for textures - The texture can be loaded from the image, the video,
  or it can be drawn from a framebuffer.
  - The image, or the video could be directly supplied from the DOM. If that's
    not ideal, the "raw pixel" data could be directly loaded onto the entity
    store, and the "loader" system can supply it. Not sure if that is good
    idea - we could make render system to get data from loader system too.
  - The framebuffers, however, require hierarchical concept to implement. Since
    we lack a concept of nested entities, this should be implemented layer.
- Stencil, culling, depth test should be settable by the material. However, this
  would directly conflict with shadow map, so "standard shader" must be provided
  as well.
- We certainly need to make a "standardized" name of uniforms and attributes,
  such as 'aPosition', 'uModel', 'uProjection'.

## So what's next?
Well, we could think of a better API first - maybe it's not good enough - but
let's just go on with it.

Then, we can add unit tests to engine logics. There's a lot to check -
from allocation logic to entity reallocation logic.

After making a better API and hardening it, the renderer can be modified to
accommodate for the forementioned features.
