import { join } from "node:path";
import type {
  AdapterKey,
  ArtifactType,
  HostKey,
  RecipeSpec,
  Selector,
} from "../types.js";
import { ADAPTER_KEYS } from "../types.js";
import { getHost, HOSTS } from "./hosts.js";

export const RECIPES: RecipeSpec[] = [
  {
    id: "claude-skill",
    host: "claude",
    artifactType: "skill",
    tier: "verified",
    templateName: "skill",
    outputPath: (adapter) => join(".claude", "skills", `mux-${adapter}`, "SKILL.md"),
  },
  {
    id: "claude-command",
    host: "claude",
    artifactType: "command",
    tier: "verified",
    templateName: "command",
    outputPath: (adapter) => join(".claude", "commands", "code-mux", `${adapter}.md`),
  },
  {
    id: "codex-skill",
    host: "codex",
    artifactType: "skill",
    tier: "verified",
    templateName: "skill",
    outputPath: (adapter) => join(".codex", "skills", `mux-${adapter}`, "SKILL.md"),
  },
  {
    id: "qoder-skill",
    host: "qoder",
    artifactType: "skill",
    tier: "verified",
    templateName: "skill",
    outputPath: (adapter) => join(".qoder", "skills", `mux-${adapter}`, "SKILL.md"),
  },
  {
    id: "qoder-command",
    host: "qoder",
    artifactType: "command",
    tier: "verified",
    templateName: "command",
    outputPath: (adapter) => join(".qoder", "commands", `mux-${adapter}.md`),
  },
  {
    id: "kimi-memory-pack",
    host: "kimi",
    artifactType: "memory-pack",
    tier: "experimental",
    templateName: "memory-pack",
    outputPath: (adapter) =>
      join(".code-mux", "experimental", "kimi", `mux-${adapter}`, "AGENTS.md"),
  },
  {
    id: "gemini-skill",
    host: "gemini",
    artifactType: "skill",
    tier: "experimental",
    templateName: "skill",
    outputPath: (adapter) =>
      join(".code-mux", "experimental", "gemini", `mux-${adapter}`, "SKILL.md"),
  },
  {
    id: "antigravity-skill",
    host: "antigravity",
    artifactType: "skill",
    tier: "experimental",
    templateName: "skill",
    outputPath: (adapter) =>
      join(".code-mux", "experimental", "antigravity", `mux-${adapter}`, "SKILL.md"),
  },
];

export function resolveAdapters(selection: Selector<AdapterKey>): AdapterKey[] {
  if (selection === "all") {
    return [...ADAPTER_KEYS];
  }

  if (!ADAPTER_KEYS.includes(selection)) {
    throw new Error(`Unknown adapter: ${selection}`);
  }

  return [selection];
}

function resolveHosts(selection: Selector<HostKey>, includeExperimental: boolean): HostKey[] {
  if (selection === "all") {
    return HOSTS.filter((host) => includeExperimental || host.tier === "verified").map(
      (host) => host.key,
    );
  }

  const host = getHost(selection);
  if (host.tier === "experimental" && !includeExperimental) {
    throw new Error(
      `Host ${selection} is experimental. Re-run with --include-experimental.`,
    );
  }

  return [selection];
}

export function resolveRecipes(
  hostSelection: Selector<HostKey>,
  artifactSelection: Selector<ArtifactType>,
  includeExperimental: boolean,
): RecipeSpec[] {
  const hosts = new Set(resolveHosts(hostSelection, includeExperimental));
  const recipes = RECIPES.filter((recipe) => hosts.has(recipe.host));

  const filtered = artifactSelection === "all"
    ? recipes
    : recipes.filter((recipe) => recipe.artifactType === artifactSelection);

  if (!filtered.length) {
    throw new Error(
      `No recipes matched host=${hostSelection} artifact=${artifactSelection}.`,
    );
  }

  for (const recipe of filtered) {
    const host = getHost(recipe.host);
    if (!host.artifacts.includes(recipe.artifactType)) {
      throw new Error(
        `Unsupported host/artifact pair: ${recipe.host}/${recipe.artifactType}.`,
      );
    }
  }

  return filtered;
}
