import { readFile, realpath, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

function parseArgs(argv) {
  const options = {
    apply: false,
    registryPath: process.env.CODE_MUX_REGISTRY_PATH || join(process.env.HOME || homedir(), ".code-mux", "registry.json"),
    tmpRoot: process.env.CODE_MUX_TMP_ROOT || tmpdir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--apply") {
      options.apply = true;
      continue;
    }
    if (token === "--registry") {
      options.registryPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--tmp-root") {
      options.tmpRoot = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function expandPrefixVariants(prefix) {
  const normalized = resolve(prefix);
  const variants = new Set([normalized]);

  if (normalized.startsWith("/private/")) {
    variants.add(normalized.slice("/private".length));
  } else if (normalized.startsWith("/var/")) {
    variants.add(`/private${normalized}`);
  }

  return [...variants];
}

async function resolveTmpPrefixes(tmpRoot) {
  const prefixes = new Set(expandPrefixVariants(tmpRoot));
  const realTmpRoot = await realpath(tmpRoot).catch(() => undefined);
  if (realTmpRoot) {
    for (const variant of expandPrefixVariants(realTmpRoot)) {
      prefixes.add(variant);
    }
  }
  return [...prefixes];
}

function isTestArtifactEntry(entry, tmpPrefixes) {
  if (!basename(entry.targetRoot).startsWith("code-mux-")) {
    return false;
  }

  return tmpPrefixes.some((prefix) => entry.targetRoot.startsWith(prefix));
}

async function loadRegistry(registryPath) {
  try {
    return JSON.parse(await readFile(registryPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

const options = parseArgs(process.argv.slice(2));
const registry = await loadRegistry(options.registryPath);

if (!registry) {
  console.log(`No registry found at ${options.registryPath}`);
  process.exit(0);
}

const tmpPrefixes = await resolveTmpPrefixes(options.tmpRoot);
const leakedEntries = registry.entries.filter((entry) => isTestArtifactEntry(entry, tmpPrefixes));

if (leakedEntries.length === 0) {
  console.log(`No test artifact entries found in ${options.registryPath}`);
  process.exit(0);
}

console.log(`Found ${leakedEntries.length} test artifact entr${leakedEntries.length === 1 ? "y" : "ies"} in ${options.registryPath}`);
for (const entry of leakedEntries) {
  console.log(`- ${entry.entryId}\t${entry.targetRoot}`);
}

if (!options.apply) {
  console.log("Dry run only. Re-run with --apply to remove these entries and their temp directories.");
  process.exit(0);
}

registry.entries = registry.entries.filter((entry) => !leakedEntries.some((candidate) => candidate.entryId === entry.entryId));

for (const entry of leakedEntries) {
  await rm(entry.targetRoot, { recursive: true, force: true });
}

if (registry.entries.length === 0) {
  await rm(options.registryPath, { force: true });
} else {
  await writeFile(options.registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

console.log(`Removed ${leakedEntries.length} test artifact entr${leakedEntries.length === 1 ? "y" : "ies"}.`);
