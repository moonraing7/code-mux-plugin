import { execFile } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const repoRoot = resolve(process.cwd());
export const testRoot = process.env.CODE_MUX_TEST_ROOT || join(tmpdir(), `code-mux-test-process-${process.pid}`);
export const testHome = process.env.CODE_MUX_TEST_HOME || join(testRoot, "home");

if (!process.env.CODE_MUX_TEST_ROOT) {
  process.on("exit", () => {
    rmSync(testRoot, { recursive: true, force: true });
  });
}

function buildCliEnv(extraEnv = {}) {
  return {
    ...process.env,
    npm_command: "",
    npm_config_user_agent: "",
    HOME: extraEnv.HOME || testHome,
    ...extraEnv,
  };
}

async function runNodeCli(entryPath, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(
    "node",
    [entryPath, ...args],
    {
      cwd: options.cwd || repoRoot,
      env: buildCliEnv(options.env || {}),
    },
  );

  return { stdout, stderr };
}

export async function makeTempDir(prefix) {
  await mkdir(testRoot, { recursive: true });
  return mkdtemp(join(testRoot, prefix));
}

export async function runRepoCli(args, options = {}) {
  return runNodeCli(join(repoRoot, "bin", "code-mux.js"), args, options);
}

export async function copyPackageRuntime(packageRoot) {
  await mkdir(packageRoot, { recursive: true });
  await cp(join(repoRoot, "assets"), join(packageRoot, "assets"), { recursive: true });
  await cp(join(repoRoot, "bin"), join(packageRoot, "bin"), { recursive: true });
  await cp(join(repoRoot, "dist"), join(packageRoot, "dist"), { recursive: true });
  await cp(join(repoRoot, "package.json"), join(packageRoot, "package.json"));
}

export async function createLocalInstalledCli(baseDir) {
  const projectRoot = baseDir || await makeTempDir("code-mux-local-install-");
  const packageRoot = join(projectRoot, "node_modules", "@moonraing7", "code-mux-plugin");
  const entryPath = join(projectRoot, "node_modules", ".bin", "code-mux");

  await copyPackageRuntime(packageRoot);
  await mkdir(join(projectRoot, "node_modules", ".bin"), { recursive: true });
  await symlink(
    join("..", "@moonraing7", "code-mux-plugin", "bin", "code-mux.js"),
    entryPath,
  );

  return { projectRoot, packageRoot, entryPath };
}

export async function createGlobalInstalledCli() {
  const prefixRoot = await makeTempDir("code-mux-global-prefix-");
  const packageRoot = join(prefixRoot, "lib", "node_modules", "@moonraing7", "code-mux-plugin");
  const entryPath = join(prefixRoot, "bin", "code-mux");

  await copyPackageRuntime(packageRoot);
  await mkdir(join(prefixRoot, "bin"), { recursive: true });
  await symlink(
    join("..", "lib", "node_modules", "@moonraing7", "code-mux-plugin", "bin", "code-mux.js"),
    entryPath,
  );

  return { prefixRoot, packageRoot, entryPath };
}

export async function runInstalledCli(entryPath, args, options = {}) {
  return runNodeCli(entryPath, args, options);
}

export async function readRegistry(homeRoot) {
  return JSON.parse(
    await readFile(join(homeRoot, ".code-mux", "registry.json"), "utf8"),
  );
}

export async function readJsonLines(path) {
  const raw = await readFile(path, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

export async function createNpmStub() {
  const stubDir = await makeTempDir("code-mux-npm-stub-");
  const stubPath = join(stubDir, "npm-stub.mjs");

  await writeFile(
    stubPath,
    `#!/usr/bin/env node
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const logPath = process.env.CODE_MUX_TEST_NPM_LOG;
if (logPath) {
  await appendFile(logPath, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd() }) + "\\n", "utf8");
}

const packageRoot = process.env.CODE_MUX_SELF_UPDATE_PACKAGE_ROOT;
const nextVersion = process.env.CODE_MUX_TEST_NEW_VERSION;
if (packageRoot && nextVersion) {
  const packageJsonPath = join(packageRoot, "package.json");
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
  pkg.version = nextVersion;
  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + "\\n", "utf8");
}
`,
    "utf8",
  );
  await chmod(stubPath, 0o755);

  return stubPath;
}
