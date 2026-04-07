import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readDoc(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("canonical and localized readmes expose reciprocal language navigation", async () => {
  const readme = await readDoc("README.md");
  const readmeZh = await readDoc("README_ZH.md");

  assert.match(readme, /^English \| \[简体中文\]\(README_ZH\.md\)$/m);
  assert.match(readmeZh, /^\[English\]\(README\.md\) \| 简体中文$/m);
});

test("readme files keep parity-critical product facts", async () => {
  const readme = await readDoc("README.md");
  const readmeZh = await readDoc("README_ZH.md");

  const sharedFacts = [
    "@moonraing7/code-mux-plugin",
    "MIT",
    "claude",
    "codex",
    "qoder",
    "kimi",
    "gemini",
    "antigravity",
    "npm install --global @moonraing7/code-mux-plugin",
    "code-mux init --ai codex --ada kimi",
    "code-mux init --ai codex --ada kimi --global",
    "code-mux update",
    "code-mux relink <entry-id> /new/path",
    "code-mux forget <entry-id>",
    ".github/workflows/release.yml",
  ];

  for (const fact of sharedFacts) {
    assert.match(readme, new RegExp(escapeRegExp(fact)));
    assert.match(readmeZh, new RegExp(escapeRegExp(fact)));
  }
});

test("agents contract records multilingual readme maintenance rules", async () => {
  const agents = await readDoc("AGENTS.md");

  assert.match(agents, /## Multilingual README Contract/);
  assert.match(agents, /README\.md` is the canonical English source/);
  assert.match(agents, /README_<LANG>\.md/);
  assert.match(agents, /reciprocal language navigation/);
  assert.match(agents, /parity-critical facts/);
});
