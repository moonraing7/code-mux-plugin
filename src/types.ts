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
export type InstallScope = "local" | "global";
export type UpdatePhase = "self-update" | "refresh";

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

export interface UpdateOptions {
  phase: UpdatePhase;
  runId?: string;
  stateFile?: string;
}

export interface PlannedFile {
  recipe: RecipeSpec;
  adapter: AdapterKey;
  absolutePath: string;
  relativePath: string;
  content: string;
}

export interface InstallResult {
  files: PlannedFile[];
  baseRoot: string;
}

export interface InstallRecord {
  entryId: string;
  scope: InstallScope;
  targetRoot: string;
  host: Selector<HostKey>;
  artifact: Selector<ArtifactType>;
  adapter: Selector<AdapterKey>;
  includeExperimental: boolean;
  createdAt: string;
  updatedAt: string;
  packageVersion: string;
}

export interface InstallRegistry {
  version: 1;
  entries: InstallRecord[];
}

export interface InstallRecordInput {
  scope: InstallScope;
  targetRoot: string;
  host: Selector<HostKey>;
  artifact: Selector<ArtifactType>;
  adapter: Selector<AdapterKey>;
  includeExperimental: boolean;
  packageVersion: string;
}
