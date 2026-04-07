import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import type { InitOptions, InstallResult, PlannedFile } from "../types.js";
import { resolveRecipes, resolveAdapters } from "./recipes.js";
import { resolveInstallBaseRoot } from "./paths.js";
import { GENERATED_MARKER, renderContent } from "./templates.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function isManaged(path: string): Promise<boolean> {
  if (!(await exists(path))) {
    return false;
  }

  const current = await readFile(path, "utf8");
  return current.includes(GENERATED_MARKER);
}

function getBaseRoot(options: InitOptions): string {
  return resolveInstallBaseRoot(options.targetDir, options.global);
}

export async function planFiles(options: InitOptions): Promise<PlannedFile[]> {
  const recipes = resolveRecipes(
    options.host,
    options.artifact,
    options.includeExperimental,
  );
  const adapters = resolveAdapters(options.adapter);
  const baseRoot = getBaseRoot(options);
  const planned: PlannedFile[] = [];

  for (const recipe of recipes) {
    for (const adapter of adapters) {
      const relativePath = recipe.outputPath(adapter);
      const absolutePath = resolve(baseRoot, relativePath);
      planned.push({
        recipe,
        adapter,
        absolutePath,
        relativePath,
        content: await renderContent(recipe, adapter),
      });
    }
  }

  return planned.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export async function install(options: InitOptions): Promise<InstallResult> {
  const planned = await planFiles(options);
  const baseRoot = getBaseRoot(options);

  for (const file of planned) {
    const managed = await isManaged(file.absolutePath);
    const alreadyExists = await exists(file.absolutePath);

    if (alreadyExists && !managed && !options.force) {
      throw new Error(
        `Refusing to overwrite unmanaged file: ${file.relativePath}. Re-run with --force.`,
      );
    }

    await mkdir(dirname(file.absolutePath), { recursive: true });
    await writeFile(file.absolutePath, file.content, "utf8");
  }

  return {
    files: planned,
    baseRoot,
  };
}

export function summarizeWrites(files: PlannedFile[], cwd: string): string[] {
  return files.map((file) => {
    const displayPath = relative(cwd, file.absolutePath) || file.absolutePath;
    return `${file.recipe.tier}\t${file.recipe.host}\t${file.recipe.artifactType}\t${file.adapter}\t${displayPath}`;
  });
}
