import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { resolve } from "node:path";
import { relinkInstallRecord } from "../lib/registry.js";

async function ensurePathExists(path: string): Promise<void> {
  try {
    await access(path, fsConstants.F_OK);
  } catch {
    throw new Error(`Relink target does not exist: ${path}`);
  }
}

export async function relinkCommand(entryId: string | undefined, nextPath: string | undefined): Promise<string> {
  if (!entryId || !nextPath) {
    throw new Error("Usage: code-mux relink <entry-id> <new-path>");
  }

  const resolvedPath = resolve(nextPath);
  await ensurePathExists(resolvedPath);
  const entry = await relinkInstallRecord(entryId, resolvedPath);
  return `relinked\t${entry.entryId}\t${entry.targetRoot}`;
}
