/**
 * In-app updater.
 *
 * Per spec §7 Update Model:
 *   - App clone has its own .git tracking github.com/aporb/agentic-os
 *   - Weekly check via GitHub releases API for new semver tag
 *   - If newer version exists, surface a banner in /settings
 *   - "Update now" runs git fetch && git checkout <tag> && npm install && npm run build
 *   - User vault is NEVER touched — vault and app code are different directories
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const STATE_PATH = join(homedir(), ".hermes", "agentic-os", "updater.json");
const REPO = "aporb/agentic-os";
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type UpdaterState = {
  last_check_ts: number;
  latest_tag: string | null;
  latest_published_at: string | null;
};

export type UpdateInfo = {
  current_version: string;
  latest_version: string | null;
  update_available: boolean;
  published_at: string | null;
};

export async function checkForUpdate(): Promise<UpdateInfo> {
  const current = currentVersion();
  const state = readState();

  const stale = Date.now() - state.last_check_ts > CHECK_INTERVAL_MS;
  if (stale) {
    try {
      const release = await fetchLatestRelease();
      state.last_check_ts = Date.now();
      state.latest_tag = release.tag;
      state.latest_published_at = release.published_at;
      writeState(state);
    } catch (err) {
      console.warn("[updater] failed to check release:", err);
    }
  }

  return {
    current_version: current,
    latest_version: state.latest_tag,
    update_available: state.latest_tag
      ? semverGt(state.latest_tag.replace(/^v/, ""), current)
      : false,
    published_at: state.latest_published_at,
  };
}

async function fetchLatestRelease(): Promise<{ tag: string; published_at: string }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const data = (await res.json()) as { tag_name: string; published_at: string };
  return { tag: data.tag_name, published_at: data.published_at };
}

export function applyUpdate(targetTag: string, repoPath: string): { ok: boolean; log: string } {
  const log: string[] = [];
  const run = (cmd: string, args: string[]) => {
    log.push(`$ ${cmd} ${args.join(" ")}`);
    try {
      const out = execFileSync(cmd, args, { cwd: repoPath, encoding: "utf8" });
      log.push(out);
    } catch (err) {
      log.push(`ERROR: ${(err as Error).message}`);
      throw err;
    }
  };
  try {
    run("git", ["fetch", "origin", "--tags"]);
    run("git", ["checkout", targetTag]);
    run("npm", ["install", "--no-audit", "--no-fund"]);
    run("npm", ["run", "build"]);
    return { ok: true, log: log.join("\n") };
  } catch {
    return { ok: false, log: log.join("\n") };
  }
}

function currentVersion(): string {
  // Read from package.json — single source of truth
  const pkgPath = join(process.cwd(), "package.json");
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

function readState(): UpdaterState {
  if (!existsSync(STATE_PATH)) {
    return { last_check_ts: 0, latest_tag: null, latest_published_at: null };
  }
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8")) as UpdaterState;
  } catch {
    return { last_check_ts: 0, latest_tag: null, latest_published_at: null };
  }
}

function writeState(s: UpdaterState) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

function semverGt(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}
