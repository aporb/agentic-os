/**
 * Web search via shell-out to free CLI tools.
 *
 * Strategy (per spec §5):
 *   1. ddgr (DuckDuckGo CLI from github.com/jarun/ddgr) — primary, free, no API key
 *   2. gogcli (Google CLI from gogcli.sh, brew install gogcli) — fallback
 *   3. Headless browser via Hermes' browser tool — last resort for scraping
 *
 * No Tavily, no Perplexity, no Bing API. The user's `npm install` doesn't
 * pull in any paid-search dependency, and the Console works offline-friendly
 * out of the box.
 *
 * Each function returns a normalized SearchResult[] regardless of backend.
 */

import { execFileSync } from "node:child_process";

export type SearchResult = {
  title: string;
  url: string;
  abstract: string;
  source: "ddgr" | "gogcli" | "browser";
};

export type SearchOptions = {
  numResults?: number;
  region?: string; // ddgr -r flag
  timeout_ms?: number;
};

export async function webSearch(
  query: string,
  opts: SearchOptions = {},
): Promise<SearchResult[]> {
  const num = opts.numResults ?? 10;
  const timeout = opts.timeout_ms ?? 8000;

  // 1. ddgr (DuckDuckGo)
  try {
    const ddg = await runDdgr(query, num, timeout, opts.region);
    if (ddg.length >= Math.min(5, num)) return ddg;
  } catch (err) {
    console.warn("[search] ddgr failed:", err);
  }

  // 2. gogcli (Google) fallback
  try {
    const gog = await runGogcli(query, num, timeout);
    if (gog.length > 0) return gog;
  } catch (err) {
    console.warn("[search] gogcli failed:", err);
  }

  // 3. No results — caller can escalate to browser if needed.
  return [];
}

async function runDdgr(
  query: string,
  num: number,
  timeout: number,
  region?: string,
): Promise<SearchResult[]> {
  const args = ["--json", "--num", String(num)];
  if (region) args.push("-r", region);
  args.push(query);

  const out = execFileSync("ddgr", args, {
    encoding: "utf8",
    timeout,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(out) as Array<{
    title: string;
    url: string;
    abstract: string;
  }>;
  return parsed.map((r) => ({
    title: r.title,
    url: r.url,
    abstract: r.abstract,
    source: "ddgr" as const,
  }));
}

async function runGogcli(
  query: string,
  num: number,
  timeout: number,
): Promise<SearchResult[]> {
  // gogcli emits JSON via --json. Tries `gog` first, then `gogcli`.
  const tryBin = (bin: string) =>
    execFileSync(bin, ["--json", "--num", String(num), query], {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

  let raw: string;
  try {
    raw = tryBin("gog");
  } catch {
    raw = tryBin("gogcli");
  }
  const parsed = JSON.parse(raw) as Array<{
    title: string;
    url: string;
    snippet?: string;
    abstract?: string;
  }>;
  return parsed.map((r) => ({
    title: r.title,
    url: r.url,
    abstract: r.snippet ?? r.abstract ?? "",
    source: "gogcli" as const,
  }));
}

/**
 * Probe whether the search tools are installed.
 * Used by /api/doctor and the install.sh prereq check.
 */
export function searchToolsAvailable(): { ddgr: boolean; gogcli: boolean } {
  const probe = (bin: string, args: string[]): boolean => {
    try {
      execFileSync(bin, args, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  return {
    ddgr: probe("ddgr", ["--version"]),
    gogcli: probe("gog", ["--version"]) || probe("gogcli", ["--version"]),
  };
}
