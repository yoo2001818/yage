export type System =
  | ((event: unknown) => void)
  | {
    update(event: unknown): void,
  };

export class SystemStore {
  systems: System[];

  constructor() {
    this.systems = [];
  }

  addSystem(system: System) {
    this.systems.push(system);
  }

  run(event: unknown): void {
    for (let i = 0; i < this.systems.length; i += 1) {
      const system = this.systems[i];
      if (typeof system === 'function') {
        system(event);
      } else {
        system.update(event);
      }
    }
  }
}
