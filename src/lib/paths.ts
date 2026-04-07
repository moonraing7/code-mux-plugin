import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function resolveRepoRoot(importMetaUrl: string): string {
  const moduleDir = dirname(fileURLToPath(importMetaUrl));
  const candidates = [
    resolve(moduleDir, ".."),
    resolve(moduleDir, "..", ".."),
  ];

  const match = candidates.find((candidate) => existsSync(resolve(candidate, "assets")));
  if (!match) {
    throw new Error("Unable to locate repository root from module path.");
  }

  return match;
}

export function resolveAssetsRoot(importMetaUrl: string): string {
  return resolve(resolveRepoRoot(importMetaUrl), "assets");
}

export function resolveHomeRoot(): string {
  return process.env.HOME || homedir();
}

export function resolveInstallBaseRoot(targetDir: string, globalInstall: boolean): string {
  if (globalInstall) {
    return resolveHomeRoot();
  }
  return targetDir;
}

export function resolveRegistryPath(): string {
  return resolve(resolveHomeRoot(), ".code-mux", "registry.json");
}
