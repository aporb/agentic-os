/**
 * Multi-profile insights data layer.
 *
 * Reads state.db from all Hermes profiles on this machine.
 * Used by /api/insights and /insights page.
 *
 * Profiles discovered from ~/.hermes/profiles/ directory.
 * Main profile (Amyn/Kodax) is at ~/.hermes/state.db directly.
 */

import Database from "better-sqlite3";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileId = string;

export type ProfileInfo = {
  id: ProfileId;
  label: string;
  role: string;
  path: string;
};

export type SessionStats = {
  sessions: number;
  messages: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  api_calls: number;
  first_session: number | null;
  last_session: number | null;
};

export type SessionRow = {
  title: string | null;
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  started_at: number;
  ended_at: number | null;
  end_reason: string | null;
  source: string;
  api_call_count: number;
};

export type SourceBreakdown = Record<string, number>;

export type EndReasonBreakdown = Record<string, number>;

export type ProfileData = {
  info: ProfileInfo;
  stats: SessionStats;
  recent_sessions: SessionRow[];
  sources: SourceBreakdown;
  end_reasons: EndReasonBreakdown;
  error_lines: number;
  gateway_status: string;
  memory_mb: number;
};

export type InsightsResponse = {
  timestamp: string;
  profiles: ProfileData[];
  totals: {
    profiles: number;
    sessions: number;
    messages: number;
    cost: number;
    tokens: number;
  };
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HERMES_DIR = join(homedir(), ".hermes");
const PROFILES_DIR = join(HERMES_DIR, "profiles");

// Known profile metadata (extend as new profiles are added)
const PROFILE_META: Record<string, { label: string; role: string }> = {
  "amyn-main": { label: "Amyn (Kodax)", role: "Superadmin / Operator" },
  "britta-jones": { label: "Britta Jones", role: "Client (Onboarding)" },
  hussain: { label: "Hussain Hashim", role: "Client (Active)" },
  "marcus-preasha": { label: "Marcus Preasha", role: "Client (Onboarding)" },
  "zamir-janmohamed": { label: "Zamir Janmohamed", role: "Client (Onboarding)" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function discoverProfiles(): ProfileInfo[] {
  const profiles: ProfileInfo[] = [];

  // Main profile (Amyn)
  const mainDb = join(HERMES_DIR, "state.db");
  if (existsSync(mainDb)) {
    profiles.push({
      id: "amyn-main",
      label: PROFILE_META["amyn-main"]?.label ?? "Amyn (Kodax)",
      role: PROFILE_META["amyn-main"]?.role ?? "Superadmin",
      path: HERMES_DIR,
    });
  }

  // Client profiles
  try {
    const dirs = readdirSync(PROFILES_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const dbPath = join(PROFILES_DIR, d.name, "state.db");
      if (!existsSync(dbPath)) continue;
      const meta = PROFILE_META[d.name] ?? {
        label: d.name,
        role: "Unknown",
      };
      profiles.push({
        id: d.name,
        label: meta.label,
        role: meta.role,
        path: join(PROFILES_DIR, d.name),
      });
    }
  } catch {
    // profiles dir may not exist
  }

  return profiles;
}

function queryDb<T>(dbPath: string, sql: string): T[] {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare(sql).all() as T[];
  } finally {
    db.close();
  }
}

function queryDbSingle<T>(dbPath: string, sql: string): T | undefined {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare(sql).get() as T | undefined;
  } finally {
    db.close();
  }
}

function countErrorLines(logPath: string): number {
  try {
    const content = require("node:fs").readFileSync(logPath, "utf8");
    return content.split("\n").filter((l: string) => l.trim()).length;
  } catch {
    return 0;
  }
}

function getGatewayStatus(profileId: string): string {
  const svc =
    profileId === "amyn-main"
      ? "hermes-gateway.service"
      : `hermes-gateway-${profileId}.service`;
  try {
    const result = require("child_process").execSync(
      `systemctl --user is-active ${svc} 2>/dev/null`,
      { encoding: "utf8", timeout: 3000 }
    );
    return result.trim();
  } catch {
    return "unknown";
  }
}

function getMemoryMb(profileId: string): number {
  try {
    const grepPattern = profileId === "amyn-main" ? "gateway run" : `${profileId}.*gateway`;
    const result = require("child_process").execSync(
      `ps aux | grep 'hermes_cli.main.*gateway' | grep -v grep | grep '${grepPattern}' | awk '{print $6/1024}' | head -1`,
      { encoding: "utf8", timeout: 3000 }
    );
    return parseFloat(result.trim()) || 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getInsights(): InsightsResponse {
  const profiles = discoverProfiles();
  const profileData: ProfileData[] = [];

  let totalSessions = 0;
  let totalMessages = 0;
  let totalCost = 0;
  let totalTokens = 0;

  for (const profile of profiles) {
    const dbPath = join(profile.path, "state.db");

    // Session stats
    const stats =
      queryDbSingle<{
        sessions: number;
        msgs: number;
        in_tok: number;
        out_tok: number;
        cost: number;
        api_calls: number;
        first_session: number | null;
        last_session: number | null;
      }>(
        dbPath,
        `SELECT
          COUNT(*) as sessions,
          COALESCE(SUM(message_count),0) as msgs,
          COALESCE(SUM(input_tokens),0) as in_tok,
          COALESCE(SUM(output_tokens),0) as out_tok,
          COALESCE(SUM(estimated_cost_usd),0.0) as cost,
          COALESCE(SUM(api_call_count),0) as api_calls,
          MIN(started_at) as first_session,
          MAX(started_at) as last_session
        FROM sessions`
      ) ?? {
        sessions: 0,
        msgs: 0,
        in_tok: 0,
        out_tok: 0,
        cost: 0,
        api_calls: 0,
        first_session: null,
        last_session: null,
      };

    const sessionStats: SessionStats = {
      sessions: stats.sessions,
      messages: stats.msgs,
      input_tokens: stats.in_tok,
      output_tokens: stats.out_tok,
      cost: stats.cost,
      api_calls: stats.api_calls,
      first_session: stats.first_session,
      last_session: stats.last_session,
    };

    // Recent sessions
    const recentSessions = queryDb<SessionRow>(
      dbPath,
      `SELECT title, message_count, input_tokens, output_tokens,
              COALESCE(estimated_cost_usd,0) as estimated_cost_usd,
              started_at, ended_at, end_reason, source, api_call_count
       FROM sessions
       WHERE title IS NOT NULL AND title != ''
       ORDER BY started_at DESC
       LIMIT 10`
    );

    // Source breakdown
    const sourceRows = queryDb<{ source: string; count: number }>(
      dbPath,
      `SELECT source, COUNT(*) as count FROM sessions GROUP BY source ORDER BY count DESC`
    );
    const sources: SourceBreakdown = {};
    for (const r of sourceRows) sources[r.source] = r.count;

    // End reasons
    const endRows = queryDb<{ end_reason: string; count: number }>(
      dbPath,
      `SELECT COALESCE(end_reason, 'active') as end_reason, COUNT(*) as count FROM sessions GROUP BY end_reason ORDER BY count DESC`
    );
    const endReasons: EndReasonBreakdown = {};
    for (const r of endRows) endReasons[r.end_reason] = r.count;

    // Error count
    const errorLog = join(profile.path, "logs", "errors.log");
    const errorLines = countErrorLines(errorLog);

    // Gateway status
    const gatewayStatus = getGatewayStatus(profile.id);

    // Memory
    const memoryMb = getMemoryMb(profile.id);

    profileData.push({
      info: profile,
      stats: sessionStats,
      recent_sessions: recentSessions,
      sources,
      end_reasons: endReasons,
      error_lines: errorLines,
      gateway_status: gatewayStatus,
      memory_mb: memoryMb,
    });

    totalSessions += sessionStats.sessions;
    totalMessages += sessionStats.messages;
    totalCost += sessionStats.cost;
    totalTokens += sessionStats.input_tokens + sessionStats.output_tokens;
  }

  return {
    timestamp: new Date().toISOString(),
    profiles: profileData,
    totals: {
      profiles: profiles.length,
      sessions: totalSessions,
      messages: totalMessages,
      cost: Math.round(totalCost * 100) / 100,
      tokens: totalTokens,
    },
  };
}
