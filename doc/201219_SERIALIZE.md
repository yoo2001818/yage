# Serialization
We need a way to load geometries from OBJ, GLTF, COLLADA file, etc.

However, most files have more than geometries - materials, lights, animations,
and bunch of stuff are included too. This is a "scene" - and we also have
scene inside the game engine.

Therefore, instead of loading / extracting geometries, we should convert the
file into serializable entities format.

Then, this entities format can be directly appended to the engine. But we don't
have that format anyway...

Therefore we need to make a serialization format in order to make OBJ loader!
We need to think about relative ID (ID offset) since material / shaders use
entity ID to reference others.

It should be simple enough, really. Each component should be able to specify
fromJSON / toJSON which receives ID mapper.
That is, the engine takes care of ID mapping - each component needs to process
its own backref though.

```tsx
export interface Component<T> {
  fromJSON(offset: number, mapId: (id: unknown) => number): void,
  toJSON(offset: number, mapId: (id: number) => unknown): void,
}
```
