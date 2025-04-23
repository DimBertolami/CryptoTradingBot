type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: { [key: string]: Listener[] } = {};

  on(event: string, listener: Listener): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  removeListener(event: string, listener: Listener): void {
    const listeners = this.events[event];
    if (listeners) {
      this.events[event] = listeners.filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
