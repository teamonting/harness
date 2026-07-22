import type { DriverService } from '@onting/browser/builder.js';

// A dummy function to simplify logic code on `BrowserRun`.
export default function createDummyDriverService(serverURL: string): DriverService {
  return {
    async address() {
      return new URL(serverURL).host;
    },
    async [Symbol.asyncDispose]() {},
    isRunning() {
      return true;
    },
    async kill() {},
    start() {
      return Promise.resolve(serverURL);
    }
  };
}
