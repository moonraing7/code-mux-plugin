import { resolve } from "node:path";
import type { InitOptions } from "../types.js";
import { install, summarizeWrites } from "../lib/install.js";
import { readPackageVersion } from "../lib/package.js";
import { upsertInstallRecord } from "../lib/registry.js";

export async function initCommand(options: InitOptions): Promise<string> {
  const result = await install(options);
  const packageVersion = await readPackageVersion(import.meta.url);
  await upsertInstallRecord({
    scope: options.global ? "global" : "local",
    targetRoot: result.baseRoot,
    host: options.host,
    artifact: options.artifact,
    adapter: options.adapter,
    includeExperimental: options.includeExperimental,
    packageVersion,
  });
  const lines = summarizeWrites(result.files, process.cwd());
  const scope = options.global ? "global" : `local:${resolve(options.targetDir)}`;

  return [
    `mode\t${scope}`,
    "registry\tupdated",
    "tier\thost\tartifact\tadapter\tpath",
    ...lines,
  ].join("\n");
}
