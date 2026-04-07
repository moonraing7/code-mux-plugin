import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(process.cwd());

async function runCli(args, options = {}) {
  const { stdout, stderr } = await execFileAsync(
    "node",
    [join(repoRoot, "bin", "code-mux.js"), ...args],
    {
      cwd: options.cwd || repoRoot,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
    },
  );

  return { stdout, stderr };
}

test("list-platforms is stable and tiered", async () => {
  const { stdout } = await runCli(["list-platforms"]);
  const lines = stdout.trim().split("\n");

  assert.equal(lines[0], "host\ttier\tartifacts\tdescription");
  assert.equal(lines[1], "claude\tverified\tskill,command\tClaude Code");
  assert.equal(lines.at(-1), "antigravity\texperimental\tskill\tAntigravity staged skill pack");
});

test("verified local install writes managed Codex skill", async () => {
  const target = await mkdtemp(join(tmpdir(), "code-mux-local-"));
  await runCli([
    "init",
    "--host",
    "codex",
    "--artifact",
    "skill",
    "--adapter",
    "gemini",
    "--target",
    target,
  ]);

  const output = join(target, ".codex", "skills", "mux-gemini", "SKILL.md");
  const content = await readFile(output, "utf8");

  assert.match(content, /generated-by: code-mux/);
  assert.match(content, /Host: `codex`/);
  assert.match(content, /gemini-oriented long-context exploration/i);
});

test("global install resolves into HOME rather than cwd", async () => {
  const fakeHome = await mkdtemp(join(tmpdir(), "code-mux-home-"));
  const workspace = await mkdtemp(join(tmpdir(), "code-mux-work-"));

  await runCli(
    [
      "init",
      "--host",
      "claude",
      "--artifact",
      "command",
      "--adapter",
      "kimi",
      "--global",
    ],
    {
      cwd: workspace,
      env: { HOME: fakeHome },
    },
  );

  const output = join(fakeHome, ".claude", "commands", "code-mux", "kimi.md");
  const content = await readFile(output, "utf8");

  assert.match(content, /Host: `claude`/);
  await assert.rejects(readFile(join(workspace, ".claude", "commands", "code-mux", "kimi.md")));
});

test("experimental host requires explicit opt-in", async () => {
  const target = await mkdtemp(join(tmpdir(), "code-mux-exp-"));

  await assert.rejects(
    runCli([
      "init",
      "--host",
      "kimi",
      "--artifact",
      "memory-pack",
      "--adapter",
      "gemini",
      "--target",
      target,
    ]),
  );

  await runCli([
    "init",
    "--host",
    "kimi",
    "--artifact",
    "memory-pack",
    "--adapter",
    "gemini",
    "--target",
    target,
    "--include-experimental",
  ]);

  const output = join(
    target,
    ".code-mux",
    "experimental",
    "kimi",
    "mux-gemini",
    "AGENTS.md",
  );
  const content = await readFile(output, "utf8");
  assert.match(content, /Experimental/);
});

test("unmanaged files fail unless force is provided", async () => {
  const target = await mkdtemp(join(tmpdir(), "code-mux-force-"));
  const output = join(target, ".codex", "skills", "mux-kimi", "SKILL.md");

  await writeFile(output, "# local edit\n", "utf8").catch(async () => {
    await import("node:fs/promises").then(({ mkdir }) =>
      mkdir(join(target, ".codex", "skills", "mux-kimi"), { recursive: true }),
    );
    await writeFile(output, "# local edit\n", "utf8");
  });

  await assert.rejects(
    runCli([
      "init",
      "--host",
      "codex",
      "--artifact",
      "skill",
      "--adapter",
      "kimi",
      "--target",
      target,
    ]),
  );

  await runCli([
    "init",
    "--host",
    "codex",
    "--artifact",
    "skill",
    "--adapter",
    "kimi",
    "--target",
    target,
    "--force",
  ]);

  const content = await readFile(output, "utf8");
  assert.match(content, /generated-by: code-mux/);
});

test("host all writes verified outputs only by default", async () => {
  const target = await mkdtemp(join(tmpdir(), "code-mux-all-"));

  await runCli([
    "init",
    "--host",
    "all",
    "--target",
    target,
  ]);

  const claudeSkill = join(target, ".claude", "skills", "mux-kimi", "SKILL.md");
  const qoderCommand = join(target, ".qoder", "commands", "mux-gemini.md");
  const codexSkill = join(target, ".codex", "skills", "mux-antigravity", "SKILL.md");
  const stagedKimi = join(target, ".code-mux", "experimental", "kimi", "mux-kimi", "AGENTS.md");

  assert.ok(await readFile(claudeSkill, "utf8"));
  assert.ok(await readFile(qoderCommand, "utf8"));
  assert.ok(await readFile(codexSkill, "utf8"));
  await assert.rejects(readFile(stagedKimi, "utf8"));
});
