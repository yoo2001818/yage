// @ts-nocheck
import { MutableComponent } from '../components';
import { EntityStore } from './simple';

describe('EntityStore', () => {
  // This only tests the entity store; it does not care about the implementation
  // of the components.
  it('should manage entities', () => {
    const store = new EntityStore();
    // Register components like this.
    // While it has a string name, it won't be used internally - instead
    // a numeric ID is used for each component.
    store.addComponent('position', new MutableComponent());
    // Or this
    const healths = new MutableComponent();
    store.addComponents({
      health: healths,
    });
    // Create an entity.
    const entity = store.create();
    store.create({
      // This is provided to the component directly. Components can receive
      // these kinds of args, then generate their own objects. Or it can use
      // given objects directly. It's up to each component.
      position: [0, 0, 0],
      health: 10,
      // This is possible too (although with some overhead)
      [healths]: 10,
    });
    // Entity can be accessed like:
    entity.set('position', [0, 0, 0]);
    entity.get('position');
    entity.delete('position');
    entity.set(healths, 10);
    entity.get(healths);
    entity.delete(healths);
    // The entity can utilize Proxy, however I'm not sure if it should
    // support it.
    entity[healths] = 10;
    console.log(entity[healths]);

    // The entity can be destroyed like this:
    store.get(1).destroy();

    const transform = new TransformIndexComponent();
    // Since the component container handles component logic directly,
    // it can manipulate the signature of the entity, or generate non-existing
    // components on the fly.
    store.addComponents({ transform });

    // Which means.. Each component can derive data from entity automatically.
    entity.get('transform');

    // This should be possible too
    const query = store.query();
    query.add('position', 'health');
    query.forEach((entity) => {
      entity.destroy();
    });

    // The entity store supports batching too. Each entity can reside in pages -
    // Each page can be bulk-processed given that all components and systems
    // support it -
    query.forEachPage((page) => {
      const pos = page.get('position');
      for (let i = 0; i < pos.length; i += 1) {
        pos[0] -= 1;
      }
    });
  });
});
