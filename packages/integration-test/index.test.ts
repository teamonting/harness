import isCI from 'is-ci';
import { BrowserRun, FileSystemSnapshotStore } from '@onting/harness';
import createStubImplementation from '@onting/stub/host.js';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('should run with custom stub implementation', async () => {
  const stubImplementation = await createStubImplementation(
    () => new FileSystemSnapshotStore({ snapshotPrefix: 'custom', testFilePath: fileURLToPath(import.meta.url) })
  );

  const run = isCI
    ? new BrowserRun('http://teamonting.github.io/browser/', {
        stubImplementation,
        webDriverURL: 'http://localhost:4444/wd/hub'
      })
    : new BrowserRun('http://teamonting.github.io/browser/', {
        stubImplementation
      });

  await run.promise;
});

test('should run with default stub implementation', async () => {
  const run = isCI
    ? new BrowserRun('http://teamonting.github.io/browser/', {
        snapshotPrefix: 'default',
        testFilePath: fileURLToPath(import.meta.url),
        webDriverURL: 'http://localhost:4444/wd/hub'
      })
    : new BrowserRun('http://teamonting.github.io/browser/', {
        snapshotPrefix: 'default',
        testFilePath: fileURLToPath(import.meta.url)
      });

  await run.promise;
});
