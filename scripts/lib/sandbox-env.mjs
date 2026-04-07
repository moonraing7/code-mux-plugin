import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function createSandbox(prefix) {
  const root = await mkdtemp(join(tmpdir(), prefix));
  const home = join(root, "home");
  const testRoot = join(root, "test-root");

  await mkdir(home, { recursive: true });
  await mkdir(testRoot, { recursive: true });

  return {
    root,
    home,
    testRoot,
  };
}

export function createSandboxEnv(sandbox, extraEnv = {}) {
  return {
    ...process.env,
    npm_command: "",
    npm_config_user_agent: "",
    HOME: sandbox.home,
    CODE_MUX_TEST_HOME: sandbox.home,
    CODE_MUX_TEST_ROOT: sandbox.testRoot,
    ...extraEnv,
  };
}

export async function runCommand(file, args, options = {}) {
  const command = [file, ...args].join(" ");
  console.log(`> ${command}`);
  const { stdout, stderr } = await execFileAsync(file, args, {
    cwd: options.cwd || resolve(process.cwd()),
    env: options.env || process.env,
  });
  if (stdout.trim()) {
    process.stdout.write(stdout);
  }
  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
}

export async function cleanupSandbox(sandbox) {
  await rm(sandbox.root, { recursive: true, force: true });
}
