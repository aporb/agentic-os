/**
 * Multi-profile insights data layer — v2 (Deep Intelligence).
 *
 * Reads state.db from all Hermes profiles.
 * Provides: summary, trends, deep dive, alerts, topic analysis, export.
 */

import Database from "better-sqlite3";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Security Utilities
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export type DailyTrend = {
  day: string; // YYYY-MM-DD
  sessions: number;
  messages: number;
  cost: number;
  tokens: number;
};

export type HourPattern = { hour: number; sessions: number };

export type ModelUsage = { model: string; sessions: number; cost: number };

export type OpenRouterBilling = {
  total_credits: number;
  daily_credits: number;
  weekly_credits: number;
  monthly_credits: number;
  estimated_usd: number;
  credit_to_usd_ratio: number | null;
  last_updated: string | null;
};

export type Alert = {
  id: string;
  profileId: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  metric: string;
  current: number;
  threshold: number;
  timestamp: string;
};

export type ProfileData = {
  info: ProfileInfo;
  stats: SessionStats;
  recent_sessions: SessionRow[];
  sources: SourceBreakdown;
  end_reasons: EndReasonBreakdown;
  error_lines: number;
  gateway_status: string;
  memory_mb: number;
  daily_trend: DailyTrend[];
  hour_pattern: HourPattern[];
  model_usage: ModelUsage[];
  health_score: number;
  risk_flags: string[];
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
  billing: OpenRouterBilling;
  alerts: Alert[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HERMES_DIR = join(homedir(), ".hermes");
const PROFILES_DIR = join(HERMES_DIR, "profiles");

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
  const mainDb = join(HERMES_DIR, "state.db");
  if (existsSync(mainDb)) {
    profiles.push({
      id: "amyn-main",
      label: PROFILE_META["amyn-main"]?.label ?? "Amyn (Kodax)",
      role: PROFILE_META["amyn-main"]?.role ?? "Superadmin",
      path: HERMES_DIR,
    });
  }
  try {
    const dirs = readdirSync(PROFILES_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const dbPath = join(PROFILES_DIR, d.name, "state.db");
      if (!existsSync(dbPath)) continue;
      const meta = PROFILE_META[d.name] ?? { label: d.name, role: "Unknown" };
      profiles.push({ id: d.name, label: meta.label, role: meta.role, path: join(PROFILES_DIR, d.name) });
    }
  } catch { /* profiles dir may not exist */ }
  return profiles;
}

function queryDb<T>(dbPath: string, sql: string, params?: unknown[]): T[] {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare(sql).all(params ?? []) as T[];
  } finally {
    db.close();
  }
}

function queryDbSingle<T>(dbPath: string, sql: string, params?: unknown[]): T | undefined {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare(sql).get(params ?? []) as T | undefined;
  } finally {
    db.close();
  }
}

function countErrorLines(logPath: string): number {
  try {
    return readFileSync(logPath, "utf8").split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

function getGatewayStatus(profileId: string): string {
  // Validate profileId against shell metacharacters
  if (!/^[a-zA-Z0-9_-]+$/.test(profileId)) return "unknown";

  const svc = profileId === "amyn-main" ? "hermes-gateway.service" : `hermes-gateway-${profileId}.service`;
  try {
    return execFileSync("systemctl", ["--user", "is-active", svc], {
      encoding: "utf8",
      timeout: 3000,
    }).trim();
  } catch {
    return "unknown";
  }
}

function getMemoryMb(profileId: string): number {
  // Validate profileId against shell metacharacters
  if (!/^[a-zA-Z0-9_-]+$/.test(profileId)) return 0;

  try {
    const grepPattern = profileId === "amyn-main" ? "gateway run" : `${profileId}.*gateway`;
    const out = execFileSync(
      "bash",
      ["-c", `ps aux | grep 'hermes_cli.main.*gateway' | grep -v grep | grep '${grepPattern}' | awk '{print $6/1024}' | head -1`],
      { encoding: "utf8", timeout: 3000 }
    );
    return parseFloat(out.trim()) || 0;
  } catch {
    return 0;
  }
}

function readStateMeta(dbPath: string, key: string): string | null {
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    const row = db.prepare("SELECT value FROM state_meta WHERE key = ?").get(key) as { value: string } | undefined;
    db.close();
    return row?.value ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Trend Analysis
// ---------------------------------------------------------------------------

function getDailyTrend(dbPath: string, days = 30): DailyTrend[] {
  const rows = queryDb<{ day: string; sessions: number; messages: number; cost: number; tokens: number }>(
    dbPath,
    `SELECT date(started_at, 'unixepoch') as day,
            COUNT(*) as sessions,
            COALESCE(SUM(message_count),0) as messages,
            COALESCE(SUM(estimated_cost_usd),0.0) as cost,
            COALESCE(SUM(input_tokens+output_tokens),0) as tokens
     FROM sessions
     WHERE started_at > strftime('%s', 'now', '-${days} days')
     GROUP BY day
     ORDER BY day ASC`
  );
  return rows.map((r) => ({ day: r.day, sessions: r.sessions, messages: r.messages, cost: Math.round(r.cost * 1000) / 1000, tokens: r.tokens }));
}

function getHourPattern(dbPath: string): HourPattern[] {
  const rows = queryDb<{ hour: string; sessions: number }>(
    dbPath,
    `SELECT CAST(strftime('%H', datetime(started_at, 'unixepoch')) AS INTEGER) as hour,
            COUNT(*) as sessions
     FROM sessions GROUP BY hour ORDER BY hour`
  );
  return rows.map((r) => ({ hour: parseInt(r.hour), sessions: r.sessions }));
}

function getModelUsage(dbPath: string): ModelUsage[] {
  const rows = queryDb<{ model: string; sessions: number; cost: number }>(
    dbPath,
    `SELECT COALESCE(model, 'unknown') as model,
            COUNT(*) as sessions,
            COALESCE(SUM(estimated_cost_usd),0.0) as cost
     FROM sessions WHERE model IS NOT NULL GROUP BY model ORDER BY sessions DESC`
  );
  return rows.map((r) => ({ model: r.model.split("/").pop() ?? r.model, sessions: r.sessions, cost: Math.round(r.cost * 1000) / 1000 }));
}

// ---------------------------------------------------------------------------
// Anomaly Detection
// ---------------------------------------------------------------------------

function computeHealthScore(stats: SessionStats, trend: DailyTrend[], errorLines: number, memoryMb: number): number {
  let score = 100;
  // Penalize high error counts
  if (errorLines > 100) score -= 15;
  else if (errorLines > 50) score -= 10;
  else if (errorLines > 20) score -= 5;
  // Penalize memory pressure
  if (memoryMb > 300) score -= 20;
  else if (memoryMb > 200) score -= 10;
  // Penalize low engagement
  if (stats.sessions > 0 && stats.messages / stats.sessions < 5) score -= 10;
  // Penalize declining trend (last 7 days avg vs prior 7 days)
  if (trend.length >= 14) {
    const recent = trend.slice(-7).reduce((s, d) => s + d.sessions, 0) / 7;
    const prior = trend.slice(-14, -7).reduce((s, d) => s + d.sessions, 0) / 7;
    if (prior > 0 && recent / prior < 0.5) score -= 15;
  }
  return Math.max(0, score);
}

function generateAlerts(profile: ProfileData): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  const makeId = (s: string) => `${profile.info.id}-${s}-${now.slice(0, 10)}`;

  if (profile.memory_mb > 300) {
    alerts.push({ id: makeId("memory"), profileId: profile.info.id, severity: "critical", title: "Memory Pressure", detail: `Gateway using ${profile.memory_mb.toFixed(0)}MB RSS. Risk of OOM kills.`, metric: "memory_mb", current: profile.memory_mb, threshold: 300, timestamp: now });
  } else if (profile.memory_mb > 200) {
    alerts.push({ id: makeId("memory"), profileId: profile.info.id, severity: "warning", title: "High Memory Usage", detail: `Gateway at ${profile.memory_mb.toFixed(0)}MB RSS. Monitor closely.`, metric: "memory_mb", current: profile.memory_mb, threshold: 200, timestamp: now });
  }

  if (profile.error_lines > 100) {
    alerts.push({ id: makeId("errors"), profileId: profile.info.id, severity: "warning", title: "Elevated Errors", detail: `${profile.error_lines} error log lines. Review for patterns.`, metric: "error_lines", current: profile.error_lines, threshold: 100, timestamp: now });
  }

  if (profile.stats.sessions === 0) {
    alerts.push({ id: makeId("inactive"), profileId: profile.info.id, severity: "info", title: "Inactive Profile", detail: "Zero sessions. Gateway running but unused.", metric: "sessions", current: 0, threshold: 1, timestamp: now });
  }

  const trend = profile.daily_trend;
  if (trend.length >= 7) {
    const recent = trend.slice(-7).reduce((s, d) => s + d.sessions, 0) / 7;
    const prior = trend.length >= 14 ? trend.slice(-14, -7).reduce((s, d) => s + d.sessions, 0) / 7 : recent;
    if (prior > 0 && recent / prior < 0.5) {
      alerts.push({ id: makeId("engagement"), profileId: profile.info.id, severity: "warning", title: "Activity Drop", detail: `Session avg dropped ${((1 - recent / prior) * 100).toFixed(0)}% over last 7 days.`, metric: "avg_sessions", current: recent, threshold: prior * 0.5, timestamp: now });
    }
  }

  if (profile.stats.sessions > 0 && profile.stats.messages / profile.stats.sessions > 100) {
    alerts.push({ id: makeId("long-sessions"), profileId: profile.info.id, severity: "info", title: "Long Sessions", detail: `Avg ${(profile.stats.messages / profile.stats.sessions).toFixed(0)} msgs/session. May indicate complexity or context bloat.`, metric: "msgs_per_session", current: profile.stats.messages / profile.stats.sessions, threshold: 100, timestamp: now });
  }

  return alerts;
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
  let allAlerts: Alert[] = [];

  for (const profile of profiles) {
    const dbPath = join(profile.path, "state.db");
    if (!existsSync(dbPath)) continue;

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
        `SELECT COUNT(*) as sessions, COALESCE(SUM(message_count),0) as msgs,
                COALESCE(SUM(input_tokens),0) as in_tok,
                COALESCE(SUM(output_tokens),0) as out_tok,
                COALESCE(SUM(estimated_cost_usd),0.0) as cost,
                COALESCE(SUM(api_call_count),0) as api_calls,
                MIN(started_at) as first_session, MAX(started_at) as last_session
         FROM sessions`
      ) ?? { sessions: 0, msgs: 0, in_tok: 0, out_tok: 0, cost: 0, api_calls: 0, first_session: null, last_session: null };

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

    const recentSessions = queryDb<SessionRow>(
      dbPath,
      `SELECT title, message_count, input_tokens, output_tokens,
              COALESCE(estimated_cost_usd,0) as estimated_cost_usd,
              started_at, ended_at, end_reason, source, api_call_count
       FROM sessions WHERE title IS NOT NULL AND title != '' ORDER BY started_at DESC LIMIT 10`
    );

    const sourceRows = queryDb<{ source: string; count: number }>(dbPath, `SELECT source, COUNT(*) as count FROM sessions GROUP BY source ORDER BY count DESC`);
    const sources: SourceBreakdown = {};
    for (const r of sourceRows) sources[r.source] = r.count;

    const endRows = queryDb<{ end_reason: string; count: number }>(
      dbPath,
      `SELECT COALESCE(end_reason, 'active') as end_reason, COUNT(*) as count FROM sessions GROUP BY end_reason ORDER BY count DESC`
    );
    const endReasons: EndReasonBreakdown = {};
    for (const r of endRows) endReasons[r.end_reason] = r.count;

    const errorLog = join(profile.path, "logs", "errors.log");
    const errorLines = countErrorLines(errorLog);
    const gatewayStatus = getGatewayStatus(profile.id);
    const memoryMb = getMemoryMb(profile.id);

    const dailyTrend = getDailyTrend(dbPath);
    const hourPattern = getHourPattern(dbPath);
    const modelUsage = getModelUsage(dbPath);

    const healthScore = computeHealthScore(sessionStats, dailyTrend, errorLines, memoryMb);
    const riskFlags: string[] = [];
    if (healthScore < 60) riskFlags.push("critical_health");
    if (errorLines > 50) riskFlags.push("high_errors");
    if (memoryMb > 200) riskFlags.push("memory_pressure");
    if (sessionStats.sessions > 0 && sessionStats.messages / sessionStats.sessions < 5) riskFlags.push("low_engagement");

    const pd: ProfileData = {
      info: profile,
      stats: sessionStats,
      recent_sessions: recentSessions,
      sources,
      end_reasons: endReasons,
      error_lines: errorLines,
      gateway_status: gatewayStatus,
      memory_mb: memoryMb,
      daily_trend: dailyTrend,
      hour_pattern: hourPattern,
      model_usage: modelUsage,
      health_score: healthScore,
      risk_flags: riskFlags,
    };

    profileData.push(pd);
    allAlerts = allAlerts.concat(generateAlerts(pd));

    totalSessions += sessionStats.sessions;
    totalMessages += sessionStats.messages;
    totalCost += sessionStats.cost;
    totalTokens += sessionStats.input_tokens + sessionStats.output_tokens;
  }

  allAlerts.sort((a, b) => {
    const sev: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity] || b.timestamp.localeCompare(a.timestamp);
  });

  // Read OpenRouter billing data from state_meta
  let billing: OpenRouterBilling = {
    total_credits: 0,
    daily_credits: 0,
    weekly_credits: 0,
    monthly_credits: 0,
    estimated_usd: totalCost,
    credit_to_usd_ratio: null,
    last_updated: null,
  };
  const mainDb = join(HERMES_DIR, "state.db");
  const snapshotRaw = readStateMeta(mainDb, "openrouter_billing_snapshot");
  const updatedRaw = readStateMeta(mainDb, "openrouter_billing_last_updated");
  if (snapshotRaw) {
    try {
      const snap = JSON.parse(snapshotRaw);
      const or = snap.openrouter || {};
      billing = {
        total_credits: or.total_credits ?? 0,
        daily_credits: or.daily_credits ?? 0,
        weekly_credits: or.weekly_credits ?? 0,
        monthly_credits: or.monthly_credits ?? 0,
        estimated_usd: totalCost,
        credit_to_usd_ratio: snap.credit_to_usd_ratio ?? null,
        last_updated: updatedRaw,
      };
    } catch { /* use defaults */ }
  }

  return {
    timestamp: new Date().toISOString(),
    profiles: profileData,
    totals: { profiles: profiles.length, sessions: totalSessions, messages: totalMessages, cost: Math.round(totalCost * 100) / 100, tokens: totalTokens },
    billing,
    alerts: allAlerts,
  };
}

export function getProfileDeepDive(profileId: string) {
  const all = getInsights();
  const profile = all.profiles.find((p) => p.info.id === profileId);
  if (!profile) return null;

  const dbPath = join(profile.info.path, "state.db");
  if (!existsSync(dbPath)) return profile;

  // Last 30 days detailed sessions
  const sessions = queryDb<SessionRow>(
    dbPath,
    `SELECT title, message_count, input_tokens, output_tokens,
            COALESCE(estimated_cost_usd,0) as estimated_cost_usd,
            started_at, ended_at, end_reason, source, api_call_count
     FROM sessions
     WHERE started_at > strftime('%s', 'now', '-30 days')
     ORDER BY started_at DESC`
  );

  // Top tool usage
  const tools = queryDb<{ tool_name: string; count: number }>(
    dbPath,
    `SELECT COALESCE(tool_name, 'none') as tool_name, COUNT(*) as count
     FROM messages WHERE tool_name IS NOT NULL GROUP BY tool_name ORDER BY count DESC LIMIT 20`
  );

  // Message count by role
  const roles = queryDb<{ role: string; count: number }>(
    dbPath,
    `SELECT role, COUNT(*) as count FROM messages GROUP BY role ORDER BY count DESC`
  );

  // Recent error lines from log
  let errorSnippets: string[] = [];
  const errorLogPath = join(profile.info.path, "logs", "errors.log");
  try {
    const content = readFileSync(errorLogPath, "utf8");
    errorSnippets = content.split("\n").filter((l) => l.trim()).slice(-10);
  } catch { /* no errors */ }

  return {
    ...profile,
    sessions_30d: sessions,
    tool_usage: tools,
    message_roles: roles,
    error_snippets: errorSnippets,
  };
}

export function getTrends(profileId?: string): { profileId: string; trend: DailyTrend[] }[] {
  const profiles = discoverProfiles();
  const out: { profileId: string; trend: DailyTrend[] }[] = [];
  for (const profile of profiles) {
    if (profileId && profile.id !== profileId) continue;
    const dbPath = join(profile.path, "state.db");
    if (!existsSync(dbPath)) continue;
    out.push({ profileId: profile.id, trend: getDailyTrend(dbPath, 30) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// HTML Export
// ---------------------------------------------------------------------------

export function generateHTMLReport(data: InsightsResponse): string {
  const head = `
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kodax Hosted Insights — ${new Date(data.timestamp).toLocaleString()}</title>
<style>
:root{--bg:#0a0a0f;--bg2:#111118;--fg:#e2e2e8;--fg2:#8888a0;--acc:#00d4ff;--warn:#ffaa00;--err:#ff4444;--ok:#00cc66;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,monospace;line-height:1.6;padding:20px;max-width:1400px;margin:0 auto}
h1,h2{color:var(--acc);margin:24px 0 12px}
.card{background:var(--bg2);border-radius:12px;padding:16px;margin:12px 0;border:1px solid #222}
.grid{display:grid;gap:12px}
.col-2{grid-template-columns:repeat(2,1fr)}.col-3{grid-template-columns:repeat(3,1fr)}.col-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:768px){.col-2,.col-3,.col-4{grid-template-columns:1fr}}
.badge{font-size:11px;text-transform:uppercase;padding:2px 8px;border-radius:4px;background:#222;font-weight:600}
.badge-warn{background:var(--warn);color:#000}.badge-err{background:var(--err);color:#fff}.badge-ok{background:var(--ok);color:#000}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px;text-align:left;border-bottom:1px solid #222}
th{color:var(--fg2);font-size:11px;text-transform:uppercase;letter-spacing:0.05em}
.bar{height:6px;border-radius:3px;background:#222;overflow:hidden;margin-top:4px}
.bar>div{height:100%;background:var(--acc);border-radius:3px}
.alert{padding:10px;border-radius:6px;margin:6px 0;font-size:13px}
.alert-crit{background:rgba(255,68,68,.1);border:1px solid var(--err)}
.alert-warn{background:rgba(255,170,0,.1);border:1px solid var(--warn)}
.alert-info{background:rgba(0,212,255,.1);border:1px solid var(--acc)}
.trend{padding:12px;overflow-x:auto}.trend svg{min-width:600px}
.footer{margin-top:40px;color:var(--fg2);font-size:11px;text-align:center}
</style>
</head><body>
<h1>Kodax Hosted Insights</h1>
<p style="color:var(--fg2);font-size:12px">Generated ${new Date(data.timestamp).toLocaleString("en-US", {timeZone:"America/New_York"})} ET · ${data.profiles.length} profiles · ${data.totals.sessions} sessions · $${data.totals.cost.toFixed(2)} spend</p>`;

  // Overview cards
  const overview = `
<div class="grid col-4">
  <div class="card"><div style="font-size:11px;color:var(--fg2);text-transform:uppercase">Profiles</div><div style="font-size:28px;font-weight:700;margin-top:4px">${data.totals.profiles}</div></div>
  <div class="card"><div style="font-size:11px;color:var(--fg2);text-transform:uppercase">Sessions</div><div style="font-size:28px;font-weight:700;margin-top:4px">${data.totals.sessions.toLocaleString()}</div></div>
  <div class="card"><div style="font-size:11px;color:var(--fg2);text-transform:uppercase">Messages</div><div style="font-size:28px;font-weight:700;margin-top:4px">${data.totals.messages.toLocaleString()}</div></div>
  <div class="card"><div style="font-size:11px;color:var(--fg2);text-transform:uppercase">Spend</div><div style="font-size:28px;font-weight:700;margin-top:4px">$${data.totals.cost.toFixed(2)}</div></div>
</div>`;

  // Alerts
  const alertsHtml = data.alerts.length > 0
    ? `<h2>Active Alerts</h2>` + data.alerts.slice(0, 10).map(a =>
        `<div class="alert alert-${a.severity === 'critical' ? 'crit' : a.severity}">
          <strong>${escapeHtml(a.title)}</strong> — ${escapeHtml(a.detail)} <span style="color:var(--fg2);font-size:11px">[${escapeHtml(a.profileId)}]</span>
        </div>`).join("")
    : "";

  // Profile details
  const profilesHtml = data.profiles.map(p => {
    const healthColor = p.health_score >= 80 ? "var(--ok)" : p.health_score >= 60 ? "var(--warn)" : "var(--err)";
    const trendSvg = p.daily_trend.length > 0
      ? `<svg viewBox="0 0 300 60" width="100%" height="60" preserveAspectRatio="none">
          <polyline fill="none" stroke="var(--acc)" stroke-width="1.5"
            points="${p.daily_trend.map((d, i) => `${(i / (Math.max(p.daily_trend.length - 1, 1))) * 300},${60 - (d.sessions / Math.max(...p.daily_trend.map(d => d.sessions), 1)) * 60}`).join(" ")}" />
         </svg>`
      : "<span style='color:var(--fg2);font-size:11px'>No trend data</span>";

    return `
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
    <div>
      <div style="font-size:18px;font-weight:700">${escapeHtml(p.info.label)}</div>
      <div style="font-size:12px;color:var(--fg2)">${escapeHtml(p.info.role)}</div>
      <span class="badge" style="margin-top:4px;display:inline-block">${p.gateway_status === "active" ? "Gateway: Active" : "Gateway: Down"}</span>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:700;color:${healthColor}">${p.health_score}</div>
      <div style="font-size:11px;color:var(--fg2)">Health Score</div>
    </div>
  </div>
  <div class="grid col-4" style="margin-top:12px">
    <div><div style="font-size:11px;color:var(--fg2)">Sessions</div><div style="font-size:16px;font-weight:600">${p.stats.sessions}</div></div>
    <div><div style="font-size:11px;color:var(--fg2)">Messages</div><div style="font-size:16px;font-weight:600">${p.stats.messages.toLocaleString()}</div></div>
    <div><div style="font-size:11px;color:var(--fg2)">Cost</div><div style="font-size:16px;font-weight:600">$${p.stats.cost.toFixed(2)}</div></div>
    <div><div style="font-size:11px;color:var(--fg2)">Tokens</div><div style="font-size:16px;font-weight:600">${(p.stats.input_tokens + p.stats.output_tokens) >= 1e6 ? ((p.stats.input_tokens + p.stats.output_tokens) / 1e6).toFixed(1) + "M" : ((p.stats.input_tokens + p.stats.output_tokens) / 1e3).toFixed(0) + "K"}</div></div>
  </div>
  <div style="margin-top:12px"><div style="font-size:11px;color:var(--fg2);margin-bottom:4px">Daily Trend (30d)</div><div class="trend" style="padding:0">${trendSvg}</div></div>
  ${p.risk_flags.length > 0 ? `<div style="margin-top:8px;font-size:11px"><span style="color:var(--warn)">⚠ Risk flags: ${p.risk_flags.join(", ")}</span></div>` : ""}
</div>`;
  }).join("");

  const footer = `<div class="footer">Kodax Hosted Insights · Generated by Hermes Agent · ${data.timestamp}</div></body></html>`;

  return head + overview + alertsHtml + `<h2>Profiles</h2>` + `<div class="grid col-1">` + profilesHtml + `</div>` + footer;
}
