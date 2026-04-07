import { cleanupSandbox, createSandbox, createSandboxEnv, runCommand } from "./lib/sandbox-env.mjs";

const sandbox = await createSandbox("code-mux-test-run-");

try {
  const env = createSandboxEnv(sandbox);
  await runCommand("bun", ["run", "build"], { env });
  await runCommand("node", ["--test"], { env });
} finally {
  await cleanupSandbox(sandbox);
}
