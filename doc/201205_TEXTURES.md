# Textures
We obviously need to support textures to render objects. However, we have to
think about how we can implement it - Usually the game engine doesn't receive
any data about textures - the renderer directly loads it.

There are mainly two types of textures, albeit they're the same in OpenGL's
side.

- Externally loaded textures (images, videos)
- Internally generated textures ("Mirrors", "Shadows")

Internally generated textures are slightly more advanced, as we need to specify
instructions to draw them! We'll deal with it later, probably when making
a shadow maps. (Ultimately we would need to make a graphics pipeline for this)

Externally loaded textures are however, simple to implement and used in even
simplest situations. We can just supply Image object onto the texture component
and it should load! Or should it?

The external data is ...external and therefore cannot be serialized well. In
this case, a 'loader system' should take account in this and perform loading on
the behalf of render system. Loader system would receive an URL and generate
texture component (which contains Image) when ready.

So...

```js
// This can be done if serialization is not a concern
const textureEnt = engine.createEntity({
  texture: {
    image,
    width: 640,
    height: 480,
  },
});

// Or this
const textureEnt = engine.createEntity({
  textureImage: { url: 'images.jpg' },
});
```

The textureLoader system would receive this 'textureImage' component and try to
map them, eventually generating texture component, which is consumed by the
render system.

I think this is simple enough?
