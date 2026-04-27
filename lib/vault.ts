/**
 * Vault filesystem operations.
 *
 * The vault is a directory on the user's disk (default ~/Documents/Second Brain/)
 * that contains four zones: sources/, wiki/, journal/, schema/.
 *
 * This module reads and writes markdown files with YAML frontmatter, and
 * exposes a tree view for the wiki browser UI.
 *
 * Critical safety rules (mirrored from spec §3 Zone Access Rules):
 *   - sources/  : agent read-only — this lib refuses writes there unless force=true
 *   - schema/   : agent read-only — same
 *   - journal/  : human-owned, agent reads only
 *   - wiki/     : agent read+write
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import matter from "gray-matter";
import { getConfig } from "./config";

export type VaultZone = "sources" | "wiki" | "journal" | "schema";

export type VaultFile = {
  zone: VaultZone | "other";
  path: string; // relative to vault root, e.g. "wiki/competitor-acme.md"
  absolute: string;
  title: string;
  status?: "draft" | "reviewed" | "stable" | "unread" | "reading" | "processed";
  tags: string[];
  created?: string;
  updated?: string;
  body: string;
  raw: string;
  frontmatter: Record<string, unknown>;
};

export type VaultTreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: VaultTreeNode[];
  zone?: VaultZone;
};

const READ_ONLY_ZONES: VaultZone[] = ["sources", "schema"];

function vaultRoot(): string {
  return getConfig().vault_path;
}

function zoneOf(relPath: string): VaultZone | "other" {
  const top = relPath.split(sep)[0];
  if (top === "sources" || top === "wiki" || top === "journal" || top === "schema") {
    return top as VaultZone;
  }
  return "other";
}

function toDateString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return undefined;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string") return [v];
  return [];
}

export function readFile(relPath: string): VaultFile {
  const root = vaultRoot();
  const absolute = join(root, relPath);
  const raw = readFileSync(absolute, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data as Record<string, unknown>;
  return {
    zone: zoneOf(relPath),
    path: relPath,
    absolute,
    title: typeof fm.title === "string" ? fm.title : relPath,
    status: fm.status as VaultFile["status"],
    tags: toStringArray(fm.tags),
    created: toDateString(fm.created),
    updated: toDateString(fm.updated),
    body: parsed.content,
    raw,
    frontmatter: fm,
  };
}

export function writeFile(
  relPath: string,
  body: string,
  frontmatter: Record<string, unknown>,
  opts: { force?: boolean } = {},
) {
  const zone = zoneOf(relPath);
  if (zone !== "other" && READ_ONLY_ZONES.includes(zone) && !opts.force) {
    throw new Error(
      `Refusing to write to read-only zone "${zone}". Pass force:true to override.`,
    );
  }

  const root = vaultRoot();
  const absolute = join(root, relPath);
  mkdirSync(dirname(absolute), { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const fm = {
    ...frontmatter,
    updated: today,
    created: frontmatter.created ?? today,
  };

  const yamlLines = Object.entries(fm)
    .map(([k, v]) => `${k}: ${formatYamlValue(v)}`)
    .join("\n");

  const content = `---\n${yamlLines}\n---\n\n${body}\n`;
  writeFileSync(absolute, content);
}

function formatYamlValue(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(x)).join(", ")}]`;
  if (typeof v === "string") {
    return v.match(/[:\[\]\{\}#&*!|>'"%@`,]/) ? JSON.stringify(v) : v;
  }
  return String(v);
}

export function listFiles(zone?: VaultZone): VaultFile[] {
  const root = vaultRoot();
  const target = zone ? join(root, zone) : root;
  if (!existsSync(target)) return [];

  const out: VaultFile[] = [];
  walk(target, (abs) => {
    if (!abs.endsWith(".md")) return;
    const rel = relative(root, abs);
    if (rel.startsWith(".") || rel.includes("node_modules")) return;
    try {
      out.push(readFile(rel));
    } catch (err) {
      // Skip files we can't parse — don't break the whole listing
      console.warn(`[vault] skip ${rel}:`, err);
    }
  });
  return out;
}

export function tree(zone?: VaultZone): VaultTreeNode {
  const root = vaultRoot();
  const target = zone ? join(root, zone) : root;
  return buildTree(target, root);
}

function buildTree(absolute: string, root: string): VaultTreeNode {
  const name = absolute === root ? "vault" : absolute.split(sep).pop()!;
  const rel = relative(root, absolute);
  const stat = statSync(absolute);
  if (!stat.isDirectory()) {
    return { name, path: rel, type: "file", zone: zoneOf(rel) as VaultZone };
  }
  const children: VaultTreeNode[] = [];
  for (const entry of readdirSync(absolute).sort()) {
    if (entry.startsWith(".")) continue;
    if (entry === "node_modules" || entry === "vault.db") continue;
    children.push(buildTree(join(absolute, entry), root));
  }
  return {
    name,
    path: rel,
    type: "dir",
    zone: zoneOf(rel) as VaultZone | undefined,
    children,
  };
}

function walk(dir: string, fn: (abs: string) => void) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".obsidian") continue;
      walk(abs, fn);
    } else {
      fn(abs);
    }
  }
}

/**
 * Search vault via SQLite FTS5.
 * The vault.db file is built by scripts/index_vault.py and refreshed by
 * the vault-index-sync cron registered at install.
 */
export function searchVault(query: string, limit = 20): VaultFile[] {
  const root = vaultRoot();
  const dbPath = join(root, "vault.db");
  if (!existsSync(dbPath)) {
    // Fallback: linear scan with naive contains
    const all = listFiles();
    const q = query.toLowerCase();
    return all
      .filter((f) => f.body.toLowerCase().includes(q) || f.title.toLowerCase().includes(q))
      .slice(0, limit);
  }
  // Lazy-import better-sqlite3 only when needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db
      .prepare(
        "SELECT path FROM pages_fts WHERE pages_fts MATCH ? ORDER BY rank LIMIT ?",
      )
      .all(query, limit) as { path: string }[];
    return rows.map((r) => readFile(r.path)).filter(Boolean);
  } finally {
    db.close();
  }
}
