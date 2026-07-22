import { BrowserRun, FileSystemSnapshotStore } from '@onting/harness';
import createStubImplementation from '@onting/stub/host.js';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('should run with custom stub implementation', async () => {
  const stubImplementation = await createStubImplementation(
    () => new FileSystemSnapshotStore({ snapshotPrefix: 'custom', testFilePath: fileURLToPath(import.meta.url) })
  );

  const run = new BrowserRun('http://localhost:5000/', {
    stubImplementation
  });

  await run.promise;
});

test('should run with default stub implementation', async () => {
  const run = new BrowserRun('http://localhost:5000/', {
    snapshotPrefix: 'default',
    testFilePath: fileURLToPath(import.meta.url)
  });

  await run.promise;
});
