/**
 * Server-side skill loader.
 *
 * Reads markdown files from hermes/skills/<pack>/*.md (shipped with the repo)
 * and overlays user customizations from <vault>/skills/<pack>/*.md.
 * Vault wins on name conflict — per spec §13.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import matter from "gray-matter";
import { getConfig } from "./config";
import { PACKS, type PackId } from "./packs";

export type SkillFrontmatter = {
  name: string;
  description: string;
  version: string;
  trigger: string[];
  integrations: string[];
  inputs: { name: string; description: string; required?: boolean }[];
  output_artifact: string;
  frequency: string;
  pack: PackId;
};

export type Skill = {
  id: string; // <pack>/<name>
  pack: PackId;
  source: "shipped" | "vault";
  path: string; // absolute
  fm: SkillFrontmatter;
  body: string;
};

const APP_ROOT = (() => {
  // When running via `next dev` the cwd is the repo root.
  // When packaged, process.cwd() should also be the repo root.
  return process.cwd();
})();

function shippedDir(): string {
  return join(APP_ROOT, "hermes", "skills");
}

function vaultSkillsDir(): string {
  return join(getConfig().vault_path, "skills");
}

function readSkillFile(absPath: string, source: "shipped" | "vault"): Skill | null {
  try {
    const raw = readFileSync(absPath, "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as SkillFrontmatter;
    if (!fm.name || !fm.pack) return null;
    return {
      id: `${fm.pack}/${fm.name}`,
      pack: fm.pack,
      source,
      path: absPath,
      fm,
      body: parsed.content,
    };
  } catch (err) {
    console.warn(`[skills] failed to parse ${absPath}:`, err);
    return null;
  }
}

export function listSkills(packId?: PackId): Skill[] {
  const seen = new Map<string, Skill>();

  // 1. Shipped skills
  const shipped = shippedDir();
  if (existsSync(shipped)) {
    for (const pack of readdirSync(shipped)) {
      if (pack.startsWith("_") || pack === "README.md" || pack === "bridge") continue;
      const packDir = join(shipped, pack);
      if (packId && pack !== packId) continue;
      try {
        for (const file of readdirSync(packDir)) {
          if (!file.endsWith(".md") || file.startsWith("_")) continue;
          const skill = readSkillFile(join(packDir, file), "shipped");
          if (skill) seen.set(skill.id, skill);
        }
      } catch {
        // not a directory
      }
    }
  }

  // 2. Vault overrides (vault wins)
  const vault = vaultSkillsDir();
  if (existsSync(vault)) {
    for (const pack of readdirSync(vault)) {
      const packDir = join(vault, pack);
      if (packId && pack !== packId) continue;
      try {
        for (const file of readdirSync(packDir)) {
          if (!file.endsWith(".md") || file.startsWith("_")) continue;
          const skill = readSkillFile(join(packDir, file), "vault");
          if (skill) seen.set(skill.id, skill);
        }
      } catch {
        // not a directory
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.fm.name.localeCompare(b.fm.name));
}

export function getSkill(packId: PackId, name: string): Skill | null {
  const all = listSkills(packId);
  return all.find((s) => s.fm.name === name) ?? null;
}
