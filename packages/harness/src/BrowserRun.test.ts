import createStubImplementation from '@onting/stub/host.js';
import expect from 'expect';
import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import BrowserRun from './BrowserRun.ts';

let server: Server;
let webDriverURL: string;

before(async () => {
  // A WebDriver server that refuses every new session, so the run ends quickly without a browser.
  server = createServer((_, res) =>
    res
      .writeHead(500, { 'content-type': 'application/json' })
      .end(JSON.stringify({ value: { error: 'session not created', message: 'No browser in this test' } }))
  );

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

  webDriverURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

after(() => server.close());

test('should accept stub implementation created by @onting/stub', async () => {
  const stubImplementation = await createStubImplementation(() => ({
    getNext: () => Promise.resolve(undefined),
    setCurrent: () => Promise.resolve()
  }));

  let run: BrowserRun | undefined;

  expect(() => {
    run = new BrowserRun('about:blank', { stubImplementation, webDriverURL });
  }).not.toThrow();

  await expect(run?.promise).rejects.toThrow('No browser in this test');
});

test('should reject stub implementation without implement()', () => {
  expect(
    () =>
      new BrowserRun('about:blank', {
        stubImplementation: { keys: [], '~types': { Stub: {} } } as never,
        webDriverURL
      })
  ).toThrow('Must have either "stubImplementation" or "testFilePath"');
});
