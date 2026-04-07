import { resolve } from "node:path";
import { forgetCommand } from "./commands/forget.js";
import { initCommand } from "./commands/init.js";
import { listPlatformsCommand } from "./commands/list-platforms.js";
import { relinkCommand } from "./commands/relink.js";
import { updateCommand } from "./commands/update.js";
import { readPackageVersion } from "./lib/package.js";
import {
  ADAPTER_KEYS,
  ARTIFACT_KEYS,
  HOST_KEYS,
  type AdapterKey,
  type ArtifactType,
  type HostKey,
  type InitOptions,
  type UpdateOptions,
} from "./types.js";

interface ParsedArgs {
  command: string | undefined;
  values: Map<string, string>;
  booleans: Set<string>;
  positionals: string[];
}

function usage(): string {
  return [
    "Usage:",
    "  code-mux --version",
    "  code-mux list-platforms",
    "  code-mux init --ai <name|all> [--ada <name|all>] [--artifact <type|all>] [--global] [--include-experimental] [--force]",
    "  code-mux init --host <name|all> [--adapter <name|all>] [--target <path>] [--artifact <type|all>] [--global] [--include-experimental] [--force]",
    "  code-mux update",
    "  code-mux relink <entry-id> <new-path>",
    "  code-mux forget <entry-id>",
    "",
    `Hosts: ${HOST_KEYS.join(", ")}`,
    `Artifacts: ${ARTIFACT_KEYS.join(", ")}`,
    `Adapters: ${ADAPTER_KEYS.join(", ")}`,
  ].join("\n");
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const values = new Map<string, string>();
  const booleans = new Set<string>();
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      booleans.add(key);
      continue;
    }

    values.set(key, next);
    index += 1;
  }

  return { command, values, booleans, positionals };
}

function readValue(values: Map<string, string>, keys: readonly string[]): string | undefined {
  const presentValues = keys
    .map((key) => values.get(key))
    .filter((value): value is string => typeof value === "string");
  const uniqueValues = [...new Set(presentValues)];

  if (uniqueValues.length > 1) {
    throw new Error(`Conflicting option values for ${keys.map((key) => `--${key}`).join(" and ")}.`);
  }

  return uniqueValues[0];
}

function readSelector<T extends string>(
  values: Map<string, string>,
  keys: readonly string[],
  allowed: readonly T[],
  fallback: T | "all",
): T | "all" {
  const value = readValue(values, keys);
  if (!value) {
    return fallback;
  }

  if (value === "all") {
    return "all";
  }

  if (!allowed.includes(value as T)) {
    throw new Error(`Unsupported ${keys.map((key) => `--${key}`).join("/")} value: ${value}`);
  }

  return value as T;
}

function buildInitOptions(parsed: ParsedArgs): InitOptions {
  const host = readSelector(parsed.values, ["ai", "host"], HOST_KEYS, "all") as HostKey | "all";
  const artifact = readSelector(
    parsed.values,
    ["artifact"],
    ARTIFACT_KEYS,
    "all",
  ) as ArtifactType | "all";
  const adapter = readSelector(
    parsed.values,
    ["ada", "adapter"],
    ADAPTER_KEYS,
    "all",
  ) as AdapterKey | "all";

  return {
    host,
    artifact,
    adapter,
    targetDir: resolve(readValue(parsed.values, ["target"]) || process.cwd()),
    global: parsed.booleans.has("global"),
    includeExperimental: parsed.booleans.has("include-experimental"),
    force: parsed.booleans.has("force"),
  };
}

function buildUpdateOptions(parsed: ParsedArgs): UpdateOptions {
  const phaseValue = readValue(parsed.values, ["update-phase"]);
  if (phaseValue && phaseValue !== "self-update" && phaseValue !== "refresh") {
    throw new Error(`Unsupported --update-phase value: ${phaseValue}`);
  }

  return {
    phase: (phaseValue as UpdateOptions["phase"] | undefined) || "self-update",
    runId: readValue(parsed.values, ["update-run-id"]),
    stateFile: readValue(parsed.values, ["update-state-file"]),
  };
}

export async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);
  const packageVersion = await readPackageVersion(import.meta.url);

  if (!parsed.command || parsed.command === "--help" || parsed.command === "help" || parsed.booleans.has("help")) {
    console.log(usage());
    return;
  }

  if (parsed.command === "--version" || parsed.command === "version") {
    console.log(packageVersion);
    return;
  }

  if (parsed.command === "list-platforms") {
    console.log(listPlatformsCommand());
    return;
  }

  if (parsed.command === "init") {
    console.log(await initCommand(buildInitOptions(parsed)));
    return;
  }

  if (parsed.command === "update") {
    console.log(await updateCommand(buildUpdateOptions(parsed)));
    return;
  }

  if (parsed.command === "relink") {
    const [entryId, newPath] = parsed.positionals;
    console.log(await relinkCommand(entryId, newPath));
    return;
  }

  if (parsed.command === "forget") {
    const [entryId] = parsed.positionals;
    console.log(await forgetCommand(entryId));
    return;
  }

  throw new Error(`Unknown command: ${parsed.command}`);
}
