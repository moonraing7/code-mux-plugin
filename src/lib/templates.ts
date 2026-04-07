import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AdapterKey, RecipeSpec } from "../types.js";
import { readPackageMetadata } from "./package.js";
import { resolveAssetsRoot } from "./paths.js";

export const GENERATED_MARKER = "<!-- generated-by: code-mux -->";

async function loadTemplate(group: string, name: string): Promise<string> {
  const assetsRoot = resolveAssetsRoot(import.meta.url);
  return readFile(resolve(assetsRoot, "templates", group, `${name}.md`), "utf8");
}

function renderValue(template: string, values: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

export async function renderContent(recipe: RecipeSpec, adapter: AdapterKey): Promise<string> {
  const baseTemplate = await loadTemplate("base", recipe.templateName);
  const adapterTemplate = await loadTemplate("adapters", adapter);
  const packageMetadata = await readPackageMetadata(import.meta.url);
  const experimentalNote = recipe.tier === "experimental"
    ? "## Experimental\n\nThis output is staged by `code-mux` and does not claim native host execution support."
    : "";

  return renderValue(baseTemplate, {
    GENERATED_MARKER,
    ADAPTER: adapter,
    HOST: recipe.host,
    ARTIFACT_TYPE: recipe.artifactType,
    HOST_TIER: recipe.tier,
    PACKAGE_VERSION: packageMetadata.version,
    ADAPTER_GUIDANCE: adapterTemplate.trim(),
    EXPERIMENTAL_NOTE: experimentalNote,
  });
}
