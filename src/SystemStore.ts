export interface System {
  (event: unknown): void,
}

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
      system(event);
    }
  }
}
