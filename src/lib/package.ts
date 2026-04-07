import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveRepoRoot } from "./paths.js";

interface PackageMetadata {
  name: string;
  version: string;
}

export async function readPackageMetadata(importMetaUrl: string): Promise<PackageMetadata> {
  const packageJsonPath = resolve(resolveRepoRoot(importMetaUrl), "package.json");
  return JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageMetadata;
}

export async function readPackageVersion(importMetaUrl: string): Promise<string> {
  const metadata = await readPackageMetadata(importMetaUrl);
  return metadata.version;
}
