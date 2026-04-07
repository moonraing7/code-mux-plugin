import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package metadata is publish-ready for npm", async () => {
  const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw);

  assert.equal(pkg.name, "@moonraing7/code-mux-plugin");
  assert.equal(pkg.license, "MIT");
  assert.equal(Object.hasOwn(pkg, "private"), false);
  assert.equal(pkg.bin["code-mux"], "bin/code-mux.js");
  assert.deepEqual(pkg.publishConfig, {
    access: "public",
    registry: "https://registry.npmjs.org/",
  });
  assert.equal(pkg.repository.url, "git+https://github.com/moonraing7/code-mux-plugin.git");
  assert.equal(pkg.homepage, "https://github.com/moonraing7/code-mux-plugin#readme");
  assert.equal(pkg.bugs.url, "https://github.com/moonraing7/code-mux-plugin/issues");
  assert.ok(pkg.files.includes("assets"));
  assert.ok(pkg.files.includes("bin"));
  assert.ok(pkg.files.includes("dist"));
  assert.ok(pkg.files.includes("LICENSE"));
  assert.ok(pkg.files.includes("README_ZH.md"));
  assert.ok(!pkg.files.includes("AGENTS.md"));
  assert.equal(pkg.scripts.prepack, "bun run build");
  assert.equal(pkg.scripts["pack:dry-run"], "npm pack --dry-run");
});

test("release workflow remains tag-driven and publishes before creating a release", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /push:\n\s+tags:\n\s+- "v\*"/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /uses: actions\/checkout@v\d+/);
  assert.match(workflow, /uses: oven-sh\/setup-bun@v2/);
  assert.match(workflow, /uses: actions\/setup-node@v\d+/);
  assert.match(workflow, /run: bun run build/);
  assert.match(workflow, /run: bun run test/);
  assert.match(workflow, /run: npm pack --dry-run/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.match(workflow, /gh release create "\$\{GITHUB_REF_NAME\}" --verify-tag --generate-notes --latest/);
});
