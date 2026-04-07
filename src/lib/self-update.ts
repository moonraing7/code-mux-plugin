import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import type { InstallScope } from "../types.js";

const execFileAsync = promisify(execFile);
const PACKAGE_NAME = "@moonraing7/code-mux-plugin";

export interface SelfUpdateContext {
  scope: InstallScope;
  packageRoot: string;
  projectRoot: string;
  invokedPath: string;
  realBinPath: string;
}

function containsSegment(path: string, segment: string): boolean {
  return path.includes(`${sep}${segment}${sep}`);
}

async function readPackageName(packageRoot: string): Promise<string | undefined> {
  try {
    const raw = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8")) as { name?: string };
    return raw.name;
  } catch {
    return undefined;
  }
}

export async function detectSelfUpdateContext(argv1: string | undefined, env: NodeJS.ProcessEnv): Promise<SelfUpdateContext> {
  if (!argv1) {
    throw new Error("Unable to determine the current CLI path for self-update.");
  }

  if (env.npm_command === "exec" || env.npm_command === "npx") {
    throw new Error("`code-mux update` does not support npm exec or npx in Milestone 1. Update the package manually, then rerun `code-mux update`.");
  }
  if (env.npm_config_user_agent?.includes("bun/")) {
    throw new Error("`code-mux update` does not support bun-based launchers in Milestone 1. Install the npm package first, then rerun `code-mux update`.");
  }

  const invokedPath = resolve(argv1);
  if (containsSegment(invokedPath, "_npx") || containsSegment(invokedPath, ".bunx")) {
    throw new Error("`code-mux update` does not support transient package-manager caches in Milestone 1. Install the package first, then rerun `code-mux update`.");
  }

  const realBinPath = await realpath(invokedPath).catch(() => invokedPath);
  if (basename(realBinPath) !== "code-mux.js") {
    throw new Error("`code-mux update` only supports installed `code-mux` binaries in Milestone 1.");
  }

  const packageRoot = dirname(dirname(realBinPath));
  const packageName = await readPackageName(packageRoot);
  if (packageName !== PACKAGE_NAME) {
    throw new Error("`code-mux update` could not resolve an installed package root.");
  }
  if (!containsSegment(packageRoot, "node_modules")) {
    throw new Error("`code-mux update` does not support source-checkout execution in Milestone 1. Update the package manually, then rerun `code-mux update`.");
  }

  if (invokedPath.includes(`${sep}node_modules${sep}.bin${sep}`)) {
    const projectRoot = packageRoot.slice(0, packageRoot.lastIndexOf(`${sep}node_modules${sep}`));
    return {
      scope: "local",
      packageRoot,
      projectRoot,
      invokedPath,
      realBinPath,
    };
  }

  if (basename(invokedPath).startsWith("code-mux") && packageRoot.includes(`${sep}lib${sep}node_modules${sep}`)) {
    return {
      scope: "global",
      packageRoot,
      projectRoot: process.cwd(),
      invokedPath,
      realBinPath,
    };
  }

  throw new Error("`code-mux update` does not support source-checkout or non-npm launcher execution in Milestone 1. Update the package manually, then rerun `code-mux update`.");
}

export async function runSelfUpdate(context: SelfUpdateContext, env: NodeJS.ProcessEnv): Promise<void> {
  const npmBin = env.CODE_MUX_NPM_BIN || "npm";
  const args = context.scope === "global"
    ? ["install", "--global", "--ignore-scripts", `${PACKAGE_NAME}@latest`]
    : ["install", "--no-save", "--ignore-scripts", `${PACKAGE_NAME}@latest`];

  await execFileAsync(npmBin, args, {
    cwd: context.scope === "local" ? context.projectRoot : process.cwd(),
    env: {
      ...process.env,
      ...env,
      CODE_MUX_SELF_UPDATE_PACKAGE_ROOT: context.packageRoot,
    },
  });
}

export async function createRefreshState(runId: string): Promise<string> {
  const configuredStateRoot = process.env.CODE_MUX_TEST_STATE_DIR;
  const stateDir = configuredStateRoot
    ? join(configuredStateRoot, runId)
    : await mkdtemp(join(tmpdir(), "code-mux-update-"));
  if (configuredStateRoot) {
    await mkdir(stateDir, { recursive: true });
  }
  const stateFile = join(stateDir, `${runId}.json`);
  await writeFile(stateFile, JSON.stringify({ runId, phase: "refresh" }), "utf8");
  return stateFile;
}

export async function validateRefreshState(runId: string | undefined, stateFile: string | undefined): Promise<void> {
  if (!runId || !stateFile) {
    throw new Error("Missing internal refresh state for `code-mux update`.");
  }

  const state = JSON.parse(await readFile(stateFile, "utf8")) as { runId?: string; phase?: string };
  if (state.runId !== runId || state.phase !== "refresh") {
    throw new Error("Invalid refresh state for `code-mux update`.");
  }
}

export async function cleanupRefreshState(stateFile: string | undefined): Promise<void> {
  if (!stateFile) {
    return;
  }

  await rm(dirname(stateFile), { recursive: true, force: true });
}
