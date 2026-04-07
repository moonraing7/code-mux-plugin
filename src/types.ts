export const HOST_KEYS = [
  "claude",
  "codex",
  "qoder",
  "kimi",
  "gemini",
  "antigravity",
] as const;

export const ADAPTER_KEYS = [
  "kimi",
  "gemini",
  "qoder",
  "antigravity",
] as const;

export const ARTIFACT_KEYS = [
  "skill",
  "command",
  "memory-pack",
] as const;

export type HostKey = (typeof HOST_KEYS)[number];
export type AdapterKey = (typeof ADAPTER_KEYS)[number];
export type ArtifactType = (typeof ARTIFACT_KEYS)[number];
export type Tier = "verified" | "experimental";
export type Selector<T extends string> = T | "all";

export interface HostSpec {
  key: HostKey;
  tier: Tier;
  description: string;
  artifacts: ArtifactType[];
}

export interface RecipeSpec {
  id: string;
  host: HostKey;
  artifactType: ArtifactType;
  tier: Tier;
  templateName: "skill" | "command" | "memory-pack";
  outputPath: (adapter: AdapterKey) => string;
}

export interface InitOptions {
  host: Selector<HostKey>;
  artifact: Selector<ArtifactType>;
  adapter: Selector<AdapterKey>;
  targetDir: string;
  global: boolean;
  includeExperimental: boolean;
  force: boolean;
}

export interface PlannedFile {
  recipe: RecipeSpec;
  adapter: AdapterKey;
  absolutePath: string;
  relativePath: string;
  content: string;
}
