import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import type { InstallRecord, InstallRecordInput, InstallRegistry } from "../types.js";
import { resolveRegistryPath } from "./paths.js";

const EMPTY_REGISTRY: InstallRegistry = {
  version: 1,
  entries: [],
};

function normalizeTargetRoot(targetRoot: string): string {
  return resolve(targetRoot);
}

function sameFootprint(left: InstallRecord, right: InstallRecordInput): boolean {
  return left.scope === right.scope
    && left.targetRoot === normalizeTargetRoot(right.targetRoot)
    && left.host === right.host
    && left.artifact === right.artifact
    && left.adapter === right.adapter
    && left.includeExperimental === right.includeExperimental;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeRegistry(path: string, registry: InstallRegistry): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}

export async function loadRegistry(): Promise<InstallRegistry> {
  const path = resolveRegistryPath();
  if (!(await fileExists(path))) {
    return EMPTY_REGISTRY;
  }

  const raw = JSON.parse(await readFile(path, "utf8")) as InstallRegistry;
  if (raw.version !== 1 || !Array.isArray(raw.entries)) {
    throw new Error(`Unsupported registry schema at ${path}.`);
  }

  return {
    version: 1,
    entries: raw.entries.map((entry) => ({
      ...entry,
      targetRoot: normalizeTargetRoot(entry.targetRoot),
    })),
  };
}

export async function listInstallRecords(): Promise<InstallRecord[]> {
  const registry = await loadRegistry();
  return [...registry.entries].sort((left, right) => left.entryId.localeCompare(right.entryId));
}

export async function upsertInstallRecord(input: InstallRecordInput): Promise<InstallRecord> {
  const path = resolveRegistryPath();
  const registry = await loadRegistry();
  const timestamp = new Date().toISOString();
  const normalizedInput = {
    ...input,
    targetRoot: normalizeTargetRoot(input.targetRoot),
  };
  const existing = registry.entries.find((entry) => sameFootprint(entry, normalizedInput));

  let record: InstallRecord;
  if (existing) {
    record = {
      ...existing,
      updatedAt: timestamp,
      packageVersion: normalizedInput.packageVersion,
    };
    registry.entries = registry.entries.map((entry) => entry.entryId === existing.entryId ? record : entry);
  } else {
    record = {
      entryId: randomUUID(),
      ...normalizedInput,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    registry.entries = [...registry.entries, record];
  }

  await writeRegistry(path, registry);
  return record;
}

export async function touchInstallRecord(entryId: string, packageVersion: string): Promise<InstallRecord> {
  const path = resolveRegistryPath();
  const registry = await loadRegistry();
  const existing = registry.entries.find((entry) => entry.entryId === entryId);

  if (!existing) {
    throw new Error(`Unknown registry entry: ${entryId}`);
  }

  const updated: InstallRecord = {
    ...existing,
    updatedAt: new Date().toISOString(),
    packageVersion,
  };
  registry.entries = registry.entries.map((entry) => entry.entryId === entryId ? updated : entry);
  await writeRegistry(path, registry);
  return updated;
}

export async function relinkInstallRecord(entryId: string, newTargetRoot: string): Promise<InstallRecord> {
  const path = resolveRegistryPath();
  const registry = await loadRegistry();
  const existing = registry.entries.find((entry) => entry.entryId === entryId);

  if (!existing) {
    throw new Error(`Unknown registry entry: ${entryId}`);
  }

  const normalizedTargetRoot = normalizeTargetRoot(newTargetRoot);
  const collision = registry.entries.find((entry) =>
    entry.entryId !== entryId
      && entry.scope === existing.scope
      && entry.targetRoot === normalizedTargetRoot
      && entry.host === existing.host
      && entry.artifact === existing.artifact
      && entry.adapter === existing.adapter
      && entry.includeExperimental === existing.includeExperimental);

  if (collision) {
    throw new Error(`Relink would collide with existing registry entry: ${collision.entryId}`);
  }

  const updated: InstallRecord = {
    ...existing,
    targetRoot: normalizedTargetRoot,
    updatedAt: new Date().toISOString(),
  };
  registry.entries = registry.entries.map((entry) => entry.entryId === entryId ? updated : entry);
  await writeRegistry(path, registry);
  return updated;
}

export async function forgetInstallRecord(entryId: string): Promise<InstallRecord> {
  const path = resolveRegistryPath();
  const registry = await loadRegistry();
  const existing = registry.entries.find((entry) => entry.entryId === entryId);

  if (!existing) {
    throw new Error(`Unknown registry entry: ${entryId}`);
  }

  registry.entries = registry.entries.filter((entry) => entry.entryId !== entryId);
  if (registry.entries.length === 0) {
    await rm(path, { force: true });
    return existing;
  }

  await writeRegistry(path, registry);
  return existing;
}
