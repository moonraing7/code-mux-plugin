import { HOSTS } from "../lib/hosts.js";

export function listPlatformsCommand(): string {
  const header = "host\ttier\tartifacts\tdescription";
  const rows = HOSTS.map((host) =>
    `${host.key}\t${host.tier}\t${host.artifacts.join(",")}\t${host.description}`
  );
  return [header, ...rows].join("\n");
}
