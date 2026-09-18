import { readFile, rename, writeFile } from "node:fs/promises";
import type { z } from "zod";

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

// Write to a sibling temp file, then rename over the original. rename() is atomic
// on POSIX, so a crash mid-write leaves the old file intact instead of a truncated one.
async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}

export interface JsonStore<T> {
  read(): Promise<T>;
  /**
   * Runs a read-modify-write cycle. `mutate` returns the next state plus a result
   * for the caller; returning the same reference it received skips the write.
   */
  update<R>(mutate: (current: T) => { next: T; result: R }): Promise<R>;
}

export function createJsonStore<T>(filePath: string, schema: z.ZodType<T>, initial: T): JsonStore<T> {
  async function read(): Promise<T> {
    try {
      return await readJsonFile(filePath, schema);
    } catch (error) {
      if (isMissingFile(error)) return initial;
      throw error;
    }
  }

  // Every read-modify-write runs through this promise chain, one at a time.
  // Without it, two concurrent signups both read the same array, both append,
  // and the second write silently drops the first user. The whole cycle is
  // serialised, not just the write, because the read is where the race starts.
  let queue: Promise<unknown> = Promise.resolve();

  function update<R>(mutate: (current: T) => { next: T; result: R }): Promise<R> {
    const run = queue.then(async () => {
      const current = await read();
      const { next, result } = mutate(current);
      if (next !== current) await writeJsonAtomic(filePath, next);
      return result;
    });
    // A failed update must not poison the chain for the callers queued behind it.
    queue = run.catch(() => undefined);
    return run;
  }

  return { read, update };
}
