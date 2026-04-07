import type { HostKey, HostSpec } from "../types.js";

export const HOSTS: HostSpec[] = [
  {
    key: "claude",
    tier: "verified",
    description: "Claude Code",
    artifacts: ["skill", "command"],
  },
  {
    key: "codex",
    tier: "verified",
    description: "Codex",
    artifacts: ["skill"],
  },
  {
    key: "qoder",
    tier: "verified",
    description: "Qoder CLI",
    artifacts: ["skill", "command"],
  },
  {
    key: "kimi",
    tier: "experimental",
    description: "Kimi staged memory pack",
    artifacts: ["memory-pack"],
  },
  {
    key: "gemini",
    tier: "experimental",
    description: "Gemini staged skill pack",
    artifacts: ["skill"],
  },
  {
    key: "antigravity",
    tier: "experimental",
    description: "Antigravity staged skill pack",
    artifacts: ["skill"],
  },
];

const HOST_MAP = new Map(HOSTS.map((host) => [host.key, host]));

export function getHost(key: HostKey): HostSpec {
  const host = HOST_MAP.get(key);
  if (!host) {
    throw new Error(`Unknown host: ${key}`);
  }
  return host;
}
