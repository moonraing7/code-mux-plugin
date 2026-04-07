#!/usr/bin/env node

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(scriptDir, "..", "dist", "cli.js");

if (!existsSync(distPath)) {
  console.error("Missing dist/cli.js. Run `bun run build` first.");
  process.exit(1);
}

const entry = await import(pathToFileURL(distPath).href);

if (typeof entry.main !== "function") {
  console.error("dist/cli.js does not export main().");
  process.exit(1);
}

await entry.main(process.argv.slice(2));
