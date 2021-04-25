// First, create EntityStore and register components...
const store = new EntityStore();
const positions = new PositionComponentContainer();
const healths = new GeneralComponentContainer({
  create: () => ({ value: 0 }),
  toJSON: (value) => value,
  fromJSON: (value) => value,
});
// Index is also considered as component. However, it doesn't get counted in
// hash code.
const chunks = new ChunkIndexComponentContainer();

store.addComponents({
  position: positions,
  health: healths,
  chunk: chunks,
});

// Then, try to create some entities.
// Each component should have "version" array which increments whenever the
// data changes.
const entity = store.create();
// Note that we must supply the value for the component. While
// ComponentContainer can intercept this, it is usually expected to provide some
// values, like:
store.create({
  position: new Position(),
  health: { value: 10 },
});

const query = store.query();
query.add('position', 'health');

query.forEach((entity) => {
  const pos = entity.get(positions);
  const health = entity.get('health');
  // Is using getter / setter good idea? absolutely not...
  if (pos.y < -100) {
    health.value -= 1;
    pos.y = 0;
    health.markChanged();
    pos.markChanged();
  }
});

// While we can use Float32Array or array directly to optimize the code,
// this completely takes away all abstractions and we have to mangle with the
// memory all the time. The thing is, JavaScript simply isn't good for this
// task. Instead of this, just keeping everything in the memory and accessing
// them from JS side would be better?
query.forEachPage((page) => {
  const posArr = page.get(positions);
  const healthArr = page.get(healths);
  for (let i = 0; i < page.length; i += 1) {
    if (posArr[i].y < -100) {
      healthArr[i].value -= 1;
      posArr[i].y = 0;
    }
  }
  posArr.markChanged();
  healthArr.markChanged();
});

entity.set('health', { value: 30 });
entity.delete('health');

entity.destroy();

// An index is also treated like a component, so the following is possible:
entity.get('chunk');

// Each component would manage all entities - therefore it'd be just call
chunks.get(entity)
// Which will read entity's key-value storage (if available) and return the
// instance.

chunks.update();

// The render systems, etc, can also retrieve and set data using components.
// For example...

query.forEachPage((page) => {
  const mesh = page.get('mesh');
  const instanced = page.get('meshInstanced');
  const gl;
  if (instanced == null) {
    const buffer = gl.createBuffer();
    // ...
    page.set('meshInstanced', buffer);
  }
  // ...
  gl.bindBuffer(gl.ARRAY_BUFFER, instanced.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, 1, 2);
});
