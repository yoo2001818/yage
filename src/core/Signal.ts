export class Signal<T extends any[]> {
  listeners: Set<(...args: T) => void>;

  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener: (...args: T) => void): void {
    this.listeners.add(listener);
  }

  unsubscribe(listener: (...args: T) => void): void {
    this.listeners.delete(listener);
  }

  emit(...args: T): void {
    this.listeners.forEach((listener) => listener(...args));
  }
}
