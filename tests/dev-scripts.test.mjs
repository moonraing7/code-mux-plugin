import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { makeTempDir, readRegistry, runRepoCli, testHome } from "./test-helpers.mjs";

const execFileAsync = promisify(execFile);

test("test helpers default HOME to an isolated test sandbox", async () => {
  const target = await makeTempDir("code-mux-default-home-");

  await runRepoCli(["init", "--ai", "codex", "--ada", "kimi"], {
    cwd: target,
  });

  const registry = await readRegistry(testHome);
  assert.equal(registry.entries.length, 1);
  assert.equal(registry.entries[0].targetRoot, await realpath(target));
});

test("clean-test-artifacts removes only temp test entries from a registry", async () => {
  const workspace = await makeTempDir("code-mux-cleanup-test-");
  const tmpRoot = join(workspace, "tmp-root");
  const registryHome = join(workspace, "home");
  const registryPath = join(registryHome, ".code-mux", "registry.json");
  const leakedTarget = join(tmpRoot, "code-mux-local-leak");
  const keptTarget = join(workspace, "real-project");

  await mkdir(join(registryHome, ".code-mux"), { recursive: true });
  await mkdir(leakedTarget, { recursive: true });
  await mkdir(keptTarget, { recursive: true });
  await writeFile(
    registryPath,
    JSON.stringify({
      version: 1,
      entries: [
        {
          entryId: "leaked-entry",
          scope: "local",
          targetRoot: leakedTarget,
          host: "codex",
          artifact: "skill",
          adapter: "kimi",
          includeExperimental: false,
          packageVersion: "0.3.0",
          createdAt: "2026-04-07T00:00:00.000Z",
          updatedAt: "2026-04-07T00:00:00.000Z",
        },
        {
          entryId: "kept-entry",
          scope: "local",
          targetRoot: keptTarget,
          host: "codex",
          artifact: "skill",
          adapter: "kimi",
          includeExperimental: false,
          packageVersion: "0.3.0",
          createdAt: "2026-04-07T00:00:00.000Z",
          updatedAt: "2026-04-07T00:00:00.000Z",
        },
      ],
    }, null, 2) + "\n",
    "utf8",
  );

  await execFileAsync("node", [
    "scripts/clean-test-artifacts.mjs",
    "--apply",
    "--registry",
    registryPath,
    "--tmp-root",
    tmpRoot,
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: registryHome,
    },
  });

  const updatedRegistry = JSON.parse(await readFile(registryPath, "utf8"));
  assert.deepEqual(updatedRegistry.entries.map((entry) => entry.entryId), ["kept-entry"]);
});

test("clean-test-artifacts does not touch the maintainer HOME registry during tests", async () => {
  const maintainerRegistryPath = join(homedir(), ".code-mux", "registry.json");
  const before = await readFile(maintainerRegistryPath, "utf8").catch(() => "");
  const tmpRoot = await makeTempDir("code-mux-cleanup-dry-run-");

  await execFileAsync("node", [
    "scripts/clean-test-artifacts.mjs",
    "--registry",
    join(tmpRoot, "missing-registry.json"),
    "--tmp-root",
    tmpRoot,
  ], {
    cwd: process.cwd(),
    env: process.env,
  });

  const after = await readFile(maintainerRegistryPath, "utf8").catch(() => "");
  assert.equal(after, before);
});
