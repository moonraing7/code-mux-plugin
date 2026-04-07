import { forgetInstallRecord } from "../lib/registry.js";

export async function forgetCommand(entryId: string | undefined): Promise<string> {
  if (!entryId) {
    throw new Error("Usage: code-mux forget <entry-id>");
  }

  await forgetInstallRecord(entryId);
  return `forgot\t${entryId}`;
}
