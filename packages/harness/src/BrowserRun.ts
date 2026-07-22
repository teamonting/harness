/// <reference types="node" />

import { buildDriverService, buildWebDriver, type DriverService } from '@onting/browser/builder.js';
import { WebDriverSession } from '@onting/browser/WebDriverSession.js';
import { type AnyStub, type StubImplementation } from '@onting/rpc';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve as pathResolve } from 'node:path';
import terminalImage from 'term-img';
import { is, object, safeParse, string } from 'valibot';
import { BrowserRunConsoleEvent, BrowserRunErrorEvent, type BrowserRunEventMap, BrowserRunLoadEvent } from './event.ts';
import FileSystemSnapshotStore from './FileSystemSnapshotStore.ts';
import createDummyDriverService from './private/createDummyDriverService.ts';
import CustomEventTarget from './private/CustomEventTarget.ts';
import unmarshalError, { errorLikeSchema } from './private/unmarshalError.ts';

type BrowserRunInit = {
  browser?: 'chrome' | 'edge' | 'firefox' | 'safari' | undefined;
  snapshotPrefix?: string | undefined;
  webDriverURL?: string | undefined;
} & (
  | {
      stubImplementation: StubImplementation<AnyStub>;
    }
  | {
      // Init fields from @onting/stub.
      testFilePath: string;
    }
);

class BrowserRun extends CustomEventTarget<BrowserRunEventMap> {
  constructor(url: string, init: BrowserRunInit) {
    super();

    void this.#asyncConstructor(url, init);

    this.#promise = new Promise((resolve, reject) => {
      this.addEventListener('error', ({ error }) => reject(error), { once: true });
      this.addEventListener('load', ({ data }) => resolve(data), { once: true });
    });
  }

  async #asyncConstructor(url: string, init: BrowserRunInit) {
    const { browser = 'chrome', snapshotPrefix, webDriverURL } = init;

    try {
      await using driverService: DriverService = webDriverURL
        ? createDummyDriverService(webDriverURL)
        : await buildDriverService(browser, {
            pipeStdio: false,
            useWindowsBinary: false
          });

      await using webDriver = await buildWebDriver(browser, await driverService.start());

      if (webDriverURL) {
        // Patch BiDi URL before first call to `getBidi()`.
        // `selenium-webdriver` does not make the URL relative to the `usingServer(serverURL)`.
        // When running under Docker, it tries to talk to `ws://172.21.0.4:4444/session/.../se/bidi`, which is unreachable.
        // See https://github.com/SeleniumHQ/selenium/issues/17788.
        const capabilities = await webDriver.getCapabilities();

        capabilities.set(
          'webSocketUrl',
          new URL(new URL(capabilities.get('webSocketUrl')).pathname, webDriverURL).href
        );
      }

      using session = new WebDriverSession(
        webDriver,
        'stubImplementation' in init
          ? init.stubImplementation
          : await (
              await import('@onting/stub/host.js')
            ).default(() => new FileSystemSnapshotStore({ snapshotPrefix, testFilePath: init.testFilePath }))
      );

      const promise = new Promise<readonly unknown[]>((resolve, reject) => {
        session.addEventListener('close', () => reject(new Error('Browser closed without result')), { once: true });
        session.addEventListener('console', ({ data, method, timestamp }) => {
          this.dispatchEvent(new BrowserRunConsoleEvent('console', { data, method, timestamp }));

          if (data[0] && typeof data[0] === 'string') {
            const [data0] = data;

            if (data0 === '🆗' || data0 === '🈴') {
              resolve(data.slice(1));
            } else if (data0 === '🆖') {
              const data1 = data[1];

              if (is(object({ error: errorLikeSchema }), data1)) {
                reject(new Error('Test failed', { cause: unmarshalError(data1.error) }));
              } else {
                reject(new Error('Test failed', { cause: undefined }));
              }
            } else if (data0 === '🖼️⚖️') {
              const data1Result = safeParse(
                object({
                  baselineImageBase64: string(),
                  currentImageBase64: string(),
                  diffImageBase64: string()
                }),
                data[1]
              );

              if (data1Result.success) {
                const { output: data1 } = data1Result;

                const buffer = Buffer.from(data1.diffImageBase64, 'base64');

                (async () => {
                  const pathname = pathResolve(tmpdir(), `@onting-image-snapshot`, crypto.randomUUID());
                  const diffImageFilename = pathResolve(pathname, `diff.png`);

                  await mkdir(pathname, { recursive: true });

                  await Promise.all([
                    writeFile(diffImageFilename, buffer),
                    writeFile(pathResolve(pathname, 'baseline.png'), Buffer.from(data1.baselineImageBase64, 'base64')),
                    writeFile(pathResolve(pathname, 'current.png'), Buffer.from(data1.currentImageBase64, 'base64'))
                  ]);

                  console.log(
                    `${terminalImage(buffer, { fallback() {} })}\nDiff image written to ${diffImageFilename}`
                  );
                })().catch(() => {});
              } else {
                console.log(...data);
              }
            }
          }
        });
        session.addEventListener('error', ({ error }) => reject(error), { once: true });
      });

      await webDriver.navigate().to(url);

      const data = await promise;

      this.dispatchEvent(new BrowserRunLoadEvent('load', { data }));
    } catch (error) {
      this.dispatchEvent(new BrowserRunErrorEvent('error', { error }));
    } finally {
      this.dispatchEvent(new Event('loadend'));
    }
  }

  #promise: Promise<readonly unknown[]>;

  // A helper Promise object instead of listening to load/error events.
  get promise(): Promise<readonly unknown[]> {
    return this.#promise;
  }
}

export default BrowserRun;
