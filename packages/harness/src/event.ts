import type { RealmConsoleEventMethod } from '@onting/browser/WebDriverSession.js';

class BrowserRunLoadEvent extends Event {
  constructor(type: 'load', eventInitDict: { data: readonly unknown[] }) {
    super(type);

    this.#data = eventInitDict.data;
  }

  #data: readonly unknown[];

  get data() {
    return this.#data;
  }
}

class BrowserRunErrorEvent extends Event {
  constructor(type: 'error', eventInitDict: { error: unknown }) {
    super(type);

    this.#error = eventInitDict.error;
  }

  #error: unknown;

  get error() {
    return this.#error;
  }
}

type BrowserRunConsoleMethod = RealmConsoleEventMethod;

type BrowserRunConsoleEventInitDict = {
  data: readonly unknown[];
  method: BrowserRunConsoleMethod;
  timestamp: number;
};

class BrowserRunConsoleEvent extends Event {
  constructor(type: 'console', eventInitDict: BrowserRunConsoleEventInitDict) {
    super(type);

    this.#data = eventInitDict.data;
    this.#method = eventInitDict.method;
    this.#timestamp = eventInitDict.timestamp;
  }

  #data: readonly unknown[];
  #method: BrowserRunConsoleMethod;
  #timestamp: number;

  get data(): readonly unknown[] {
    return this.#data;
  }

  get method(): BrowserRunConsoleMethod {
    return this.#method;
  }

  get timestamp(): number {
    return this.#timestamp;
  }
}

type BrowserRunEventMap = {
  abort: Event;
  console: BrowserRunConsoleEvent;
  error: BrowserRunErrorEvent;
  load: BrowserRunLoadEvent;
};

export { BrowserRunConsoleEvent, BrowserRunErrorEvent, BrowserRunLoadEvent };
export type { BrowserRunEventMap };
