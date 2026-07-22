/// <reference types="node" />

import type { SnapshotStore } from '@onting/stub';
import { isCI } from 'ci-info';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import cleanPrefix from './private/cleanPrefix.ts';

function createSnapshotPath(testFilePath: string, prefix: string | undefined, suffix: string): string {
  return resolve(
    dirname(testFilePath),
    `${[...basename(testFilePath).split('.').slice(0, -1), ...(prefix ? [prefix] : []), suffix].join('.')}`
  );
}

type FileSystemSnapshotStoreInit = {
  readonly snapshotPrefix?: string | undefined;
  readonly testFilePath: string;
};

class FileSystemSnapshotStore implements SnapshotStore {
  constructor({ snapshotPrefix, testFilePath }: FileSystemSnapshotStoreInit) {
    this.#snapshotPrefix = snapshotPrefix && cleanPrefix(snapshotPrefix);
    this.#testFilePath = testFilePath;
  }

  #counter = 0;
  readonly #snapshotPrefix: string | undefined;
  readonly #testFilePath: string;

  async getNext(type: Parameters<SnapshotStore['getNext']>[0]) {
    if (type !== 'image/png') {
      throw new Error('Only "image/png" is supported');
    }

    const filename = createSnapshotPath(this.#testFilePath, this.#snapshotPrefix, `snap-${++this.#counter}.png`);

    try {
      return (await readFile(filename)).buffer;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        if (isCI) {
          throw new Error(`Cannot find image snapshot file "${filename}" in CI mode`);
        }

        return;
      }

      throw error;
    }
  }

  async setCurrent(type: Parameters<SnapshotStore['setCurrent']>[0], data: Parameters<SnapshotStore['setCurrent']>[1]) {
    if (type !== 'image/png') {
      throw new Error('Only "image/png" is supported');
    }

    const filename = createSnapshotPath(this.#testFilePath, this.#snapshotPrefix, `snap-${this.#counter}.png`);

    if (isCI) {
      throw new Error(`Cannot write to image snapshot file "${filename}" in CI mode`);
    }

    await writeFile(filename, Buffer.from(data));
  }
}

export default FileSystemSnapshotStore;
export type { FileSystemSnapshotStoreInit };
