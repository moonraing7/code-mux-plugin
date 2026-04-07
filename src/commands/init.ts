import { resolve } from "node:path";
import type { InitOptions } from "../types.js";
import { install, summarizeWrites } from "../lib/install.js";

export async function initCommand(options: InitOptions): Promise<string> {
  const writes = await install(options);
  const lines = summarizeWrites(writes, process.cwd());
  const scope = options.global ? "global" : `local:${resolve(options.targetDir)}`;

  return [
    `mode\t${scope}`,
    "tier\thost\tartifact\tadapter\tpath",
    ...lines,
  ].join("\n");
}
