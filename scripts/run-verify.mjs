import { runCommand } from "./lib/sandbox-env.mjs";

await runCommand("bun", ["run", "build"]);
await runCommand("bun", ["run", "test"]);
await runCommand("bun", ["run", "smoke"]);
await runCommand("npm", ["pack", "--dry-run"]);
