import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { promisify } from "node:util";
import type { InstallRecord, UpdateOptions } from "../types.js";
import { install, summarizeWrites } from "../lib/install.js";
import { readPackageVersion } from "../lib/package.js";
import { listInstallRecords, touchInstallRecord } from "../lib/registry.js";
import { resolveRegistryPath } from "../lib/paths.js";
import {
  cleanupRefreshState,
  createRefreshState,
  detectSelfUpdateContext,
  runSelfUpdate,
  validateRefreshState,
} from "../lib/self-update.js";

const execFileAsync = promisify(execFile);

async function logPhaseEvent(event: string, details: Record<string, string | undefined>): Promise<void> {
  const logPath = process.env.CODE_MUX_TEST_PHASE_LOG;
  if (!logPath) {
    return;
  }

  await appendFile(logPath, `${JSON.stringify({ event, ...details })}\n`, "utf8");
}

function summarizeEntryWrites(entry: InstallRecord, lines: string[]): string[] {
  return lines.map((line) => `${entry.entryId}\t${line}`);
}

function summarizeStaleEntry(entry: InstallRecord): string[] {
  return [
    `stale\t${entry.entryId}\t${entry.scope}\t${entry.targetRoot}`,
    `repair\tcode-mux relink ${entry.entryId} /new/path`,
    `repair\tcode-mux forget ${entry.entryId}`,
  ];
}

async function refreshRegistryEntries(): Promise<string> {
  const packageVersion = await readPackageVersion(import.meta.url);
  const registryPath = resolveRegistryPath();
  const entries = await listInstallRecords();
  const refreshed: string[] = [];
  const stale: string[] = [];

  for (const entry of entries) {
    if (!existsSync(entry.targetRoot)) {
      stale.push(...summarizeStaleEntry(entry));
      continue;
    }

    const result = await install({
      host: entry.host,
      artifact: entry.artifact,
      adapter: entry.adapter,
      targetDir: entry.targetRoot,
      // During refresh, the registry target root is authoritative even for global entries.
      global: false,
      includeExperimental: entry.includeExperimental,
      force: false,
    });
    await touchInstallRecord(entry.entryId, packageVersion);
    refreshed.push(...summarizeEntryWrites(entry, summarizeWrites(result.files, process.cwd())));
  }

  return [
    "phase\trefresh",
    `code-mux-version\t${packageVersion}`,
    `registry\t${relative(process.cwd(), registryPath) || registryPath}`,
    "entry-id\ttier\thost\tartifact\tadapter\tpath",
    ...refreshed,
    ...stale,
  ].join("\n");
}

export async function updateCommand(options: UpdateOptions): Promise<string> {
  if (options.phase === "refresh") {
    try {
      await logPhaseEvent("refresh:start", {
        runId: options.runId,
        stateFile: options.stateFile,
      });
      await validateRefreshState(options.runId, options.stateFile);
      const result = await refreshRegistryEntries();
      await logPhaseEvent("refresh:complete", {
        runId: options.runId,
        stateFile: options.stateFile,
      });
      return result;
    } finally {
      await cleanupRefreshState(options.stateFile);
      await logPhaseEvent("refresh:cleanup", {
        runId: options.runId,
        stateFile: options.stateFile,
      });
    }
  }

  const context = await detectSelfUpdateContext(process.argv[1], process.env);
  const runId = options.runId || randomUUID();
  const stateFile = await createRefreshState(runId);

  try {
    await logPhaseEvent("self-update:start", {
      runId,
      stateFile,
      invokedPath: context.invokedPath,
    });
    await runSelfUpdate(context, process.env);
    await logPhaseEvent("self-update:complete", {
      runId,
      stateFile,
      invokedPath: context.invokedPath,
    });
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      context.invokedPath,
      "update",
      "--update-phase",
      "refresh",
      "--update-run-id",
      runId,
      "--update-state-file",
      stateFile,
    ], {
      cwd: process.cwd(),
      env: process.env,
    });

    if (stderr.trim()) {
      return stdout.trim() || stderr.trim();
    }

    return stdout.trim();
  } catch (error) {
    await cleanupRefreshState(stateFile);
    await logPhaseEvent("self-update:cleanup", {
      runId,
      stateFile,
      invokedPath: context.invokedPath,
    });
    throw error;
  }
}
