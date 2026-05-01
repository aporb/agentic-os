# Insights Dashboard v2 — Gap Analysis

> Generated: 2026-04-30
> Scope: Full comparison of Kodax Hosted Insights dashboard against the v2 architecture spec (`wiki/kodax-dashboard-architecture.md`), product spec (`wiki/draft-agentic-os-spec.md`), and codebase conventions (`AGENTS.md`).

---

## 1. Spec Compliance

### What Was Planned vs What Was Built

| Planned Feature | Status | Notes |
|----------------|--------|-------|
| `/insights` page route | ✅ Built | Server component rendering `<Dashboard />` |
| `/api/insights` JSON endpoint | ✅ Built | Returns `InsightsResponse` with profiles, totals, alerts |
| Multi-profile state.db discovery | ✅ Built | `lib/insights.ts` discovers profiles from `~/.hermes/profiles/` |
| Overview cards (profiles, sessions, messages, cost) | ✅ Built | In `MissionControl` tab |
| Cost distribution table | ✅ Built | Recharts-based in `CFOView` and `DailySpendChart` |
| Per-profile detail cards | ✅ Built | In `ClientCenter` tab with expandable detail panels |
| Error analysis + recommendations | ✅ Built | In `DeepIntel` tab (`AnomalyDetection`, `Recommendations`) |
| System overview | ✅ Built | `MissionControl` tab with fleet status, alerts |
| Health scoring per profile | ✅ Built | `computeHealthScore()` with multi-factor analysis |
| Alert generation | ✅ Built | `generateAlerts()` with severity levels (critical/warning/info) |
| Daily trend analysis (30d) | ✅ Built | `getDailyTrend()` with SQL aggregation |
| Hour-of-day patterns | ✅ Built | `getHourPattern()` + heatmap in CMO view |
| Model usage breakdown | ✅ Built | `getModelUsage()` + pie chart in CFO view |
| HTML export generation | ✅ Built (backend only) | `generateHTMLReport()` produces standalone HTML |
| Deep-dive per-profile endpoint | ✅ Built (backend only) | `getProfileDeepDive()` with tool usage, roles, error snippets |
| Chat interface (streaming via Hermes API) | ❌ Not built | Listed in architecture doc as "not yet implemented" |
| Notification system (PWA Push + Telegram) | ❌ Not built | Listed in architecture doc as "not yet implemented" |
| Quick actions (one-tap skill execution) | ❌ Not built | Listed in architecture doc as "not yet implemented" |
| Knowledge explorer (force-directed graph) | ❌ Not built | Listed in architecture doc as "not yet implemented" |
| Workflow builder (visual automation chains) | ❌ Not built | Listed in architecture doc as "not yet implemented" |
| TanStack Query for server-state caching | ❌ Not built | Raw `fetch` + `setInterval(30s)` used instead |
| WebSocket/SSE for live updates | ❌ Not built | Polling architecture instead |

**Compliance score: 12/19 planned features implemented (63%)** — but the 5 explicitly "not yet implemented" features were known deferred items, so effective compliance of *in-scope* work is **12/14 = 86%**.

---

## 2. Missing Features

### Tier 1 — Backend Built But No Frontend Consumers

| Feature | Backend | Frontend | Issue |
|---------|---------|----------|-------|
| `/api/insights/profile/[id]` | ✅ `getProfileDeepDive()` | ❌ Never called | Dead endpoint. No navigation or UI to trigger it |
| `/api/insights/export` | ✅ `generateHTMLReport()` | ❌ Never called | Dead endpoint. No export button in dashboard UI |
| Profile deep-dive data (tool usage, role breakdown, error snippets) | ✅ Returned by API | ❌ Not displayed | Data is fetched but discarded |

### Tier 2 — Explicitly Deferred per Architecture Doc

These are documented as "key planned features not yet implemented" in the architecture spec:

1. **Chat interface** — Streaming responses via Hermes API Server SSE
2. **Notification system** — PWA Push API + Telegram fallback for alerts
3. **Quick actions** — One-tap skill execution from dashboard tiles
4. **Knowledge explorer** — Force-directed graph visualization of vault connections
5. **Workflow builder** — Visual automation chain editor

### Tier 3 — Spec Convention Gaps

| Convention | Gap |
|-----------|-----|
| TanStack Query (§5 tech stack) | Not used. Raw fetch + setInterval polling violates the server-state cache pattern |
| Mobile-first 44px tap targets (AGENTS.md) | Tab buttons are ~36px tall (py-2.5 ≈ 36px). Below the 44px minimum |
| `validateToken()` on all `/api/*` routes (AGENTS.md) | **No auth on any insights API route** — see §6 Security Gaps |

---

## 3. Architecture Gaps

### 3.1 Data Flow Issues

**`getProfileDeepDive()` is O(n²)**

```typescript
// lib/insights.ts line 421-422
export function getProfileDeepDive(profileId: string) {
  const all = getInsights();  // Re-queries ALL profiles from ALL state.db files
  const profile = all.profiles.find((p) => p.info.id === profileId);
```

Every call to the profile deep-dive endpoint re-executes `getInsights()`, which opens, queries, and closes every profile's state.db. This is wasteful — the endpoint only needs data for one profile.

**Recommendation:** Extract the per-profile query logic into a standalone `getProfileData(profileInfo: ProfileInfo): ProfileData` function that `getInsights()` and `getProfileDeepDive()` can both call.

### 3.2 Hardcoded Profile Metadata

```typescript
// lib/insights.ts lines 113-119
const PROFILE_META: Record<string, { label: string; role: string }> = {
  "amyn-main": { label: "Amyn (Kodax)", role: "Superadmin / Operator" },
  "britta-jones": { label: "Britta Jones", role: "Client (Onboarding)" },
  hussain: { label: "Hussain Hashim", role: "Client (Active)" },
  "marcus-preasha": { label: "Marcus Preasha", role: "Client (Onboarding)" },
  "zamir-janmohamed": { label: "Zamir Janmohamed", role: "Client (Onboarding)" },
};
```

Any new profile gets `{ label: "<id>", role: "Unknown" }`. This should be dynamic — either read from profile config files, a config.json, or at minimum stored in a database table.

### 3.3 No Caching Layer

All three API routes use `export const dynamic = "force-dynamic"` with zero caching:

- No in-memory cache with TTL
- No ETag headers
- No `Cache-Control` headers
- No stale-while-revalidate pattern

Every 30-second client poll triggers a full re-read of all SQLite databases, process memory queries, and systemctl status checks. This is fine for 1-2 profiles but won't scale to 10+.

### 3.4 Component Architecture

The implementation diverged from the original spec's component structure:

| Spec Called For | Actually Built |
|---------------|----------------|
| `overview.tsx` — system overview cards | Replaced by `MissionControl` tab |
| `cost-table.tsx` — cost distribution | Replaced by `CFOView` within `CSuiteCockpit` |
| `profile-cards.tsx` — per-profile detail | Replaced by `ClientCenter` tab |
| `error-analysis.tsx` — error analysis | Replaced by `DeepIntel` tab |

**The 4 original spec components are dead code** — they exist on disk but are imported by nothing. The dashboard uses a tabbed architecture (`mission-control.tsx`, `c-suite.tsx`, `client-center.tsx`, `deep-intel.tsx`) that supersedes them.

---

## 4. UX/Design Issues

### 4.1 Missing UI for Backend Features

- **No export button** — The HTML export API (`/api/insights/export`) has no corresponding UI element. The "Dual Delivery" pattern in the spec (live webapp + HTML export to Telegram) is half-implemented.
- **No profile drill-down** — The profile deep-dive API exists but no click interaction on profile cards navigates to it or opens a detail modal.

### 4.2 Mobile Experience

- **Tab overflow on mobile** — Dashboard tabs use `overflow-x-auto` which may hide the rightmost tab ("Deep Intelligence") on small screens without any scroll indicator.
- **Tap target size** — Tab buttons have `py-2.5` (~36px height), below the 44px minimum required by AGENTS.md. The `dense` class exemption doesn't apply here (these are primary navigation, not sidebar/table items).
- **Table in cost-table.tsx** — Uses horizontal scroll (`overflow-x-auto`), which violates the "no horizontal scroll" rule. (Note: this component is dead code, but worth flagging for the CFO view which also has tables.)

### 4.3 Accessibility

- **No ARIA roles** on tab navigation — The tab bar is rendered as plain `<button>` elements without `role="tablist"`, `role="tab"`, `role="tabpanel"`, or `aria-selected` attributes.
- **No keyboard navigation** for tabs — Missing arrow-key handling that tab widgets require per WAI-ARIA.
- **Color-only status indicators** — Health scores and memory status rely solely on color (`text-[hsl(var(--success))]`). No text alternative or icon differentiation for colorblind users (though icons like Shield are present, the health *score* itself is color-coded only).

### 4.4 Hardcoded Timezone

```typescript
// dashboard.tsx line 85
timeZone: "America/New_York",
```

Timestamp in the dashboard header is hardcoded to US Eastern. Should use the user's timezone or a configurable setting.

---

## 5. Performance Concerns

### 5.1 Polling Architecture

```typescript
// dashboard.tsx line 50
const interval = setInterval(fetchData, 30000);
```

30-second polling means:
- 2 requests/minute × 60 minutes × N tabs open = N×120 requests/hour
- Each request opens and closes every profile's state.db
- Each request runs `systemctl` and `ps aux` shell commands per profile

For 5 profiles, this means 5 SQLite open/close cycles + 10 shell command executions every 30 seconds.

**Recommendation:** Consider WebSocket or Server-Sent Events for push-based updates, or at minimum add ETag/conditional-get support so the client can skip re-rendering when data hasn't changed.

### 5.2 Shell Command Execution

`getGatewayStatus()` and `getMemoryMb()` shell out via `execSync`:

```typescript
// lib/insights.ts line 179
execSync(`systemctl --user is-active ${svc} 2>/dev/null`, { encoding: "utf8", timeout: 3000 })

// lib/insights.ts line 189-192
execSync(
  `ps aux | grep 'hermes_cli.main.*gateway' | grep -v grep | grep '${grepPattern}' | awk '{print $6/1024}' | head -1`,
  { encoding: "utf8", timeout: 3000 }
)
```

Issues:
- `execSync` blocks the Node.js event loop
- Shell pipeline in `getMemoryMb` is fragile — depends on `ps aux` output format, `grep`, `awk` all being available
- `profileId` is interpolated directly into shell commands — if a profile ID contains shell metacharacters, this is a command injection risk

### 5.3 Bundle Size — `recharts`

`recharts@^2.12.7` is ~200KB+ gzipped. This is the single heaviest dependency in the insights module. The spec explicitly says "No heavy component libraries" and lists shadcn-style local components.

The dashboard uses recharts for: LineChart (daily spend, trends), BarChart (sources, model costs, hour-of-day, engagement), PieChart (sessions by model).

**Recommendation:** For v2, consider lighter alternatives (visx, lightweight-charts, or custom SVG) to stay within the "no heavy component libraries" principle. Or accept the tradeoff and document it.

### 5.4 Redundant Data Processing

Multiple components independently aggregate the same data:
- `DailySpendChart` in mission-control re-aggregates daily costs
- `TrendAnalysis` in deep-intel re-aggregates daily trends
- `SourceDistribution` in mission-control re-aggregates source data
- `CombinedView` in c-suite re-aggregates hour patterns and platform data

Each aggregation iterates all profiles independently. This could be computed once in the data layer.

---

## 6. Security Gaps

### 6.1 🔴 CRITICAL: No Authentication on Insights API Routes

**This is the most severe finding in the gap analysis.**

The AGENTS.md convention is explicit:

> "All `/api/*` routes call `validateToken()` first."

Every other API route in the codebase uses `validateToken()`:
- `/api/auth` ✅
- `/api/vault/[...path]` ✅
- `/api/hermes/[...path]` ✅
- `/api/sources/*` ✅
- `/api/search` ✅
- `/api/skills/*` ✅

**The three insights routes are the only ones without auth:**
- `/api/insights/route.ts` ❌ **No `validateToken()` call**
- `/api/insights/profile/[id]/route.ts` ❌ **No `validateToken()` call**
- `/api/insights/export/route.ts` ❌ **No `validateToken()` call**

This means anyone who can reach port 18443 (or the Tailscale funnel address) can read all profile data, session history, cost information, error logs, memory usage, and gateway status without any token.

**Fix:** Add `import { validateToken } from "@/lib/auth"` and check `validateToken(req)` at the top of each route handler, returning 401 if invalid.

### 6.2 XSS in HTML Export

```typescript
// lib/insights.ts line 549
`<div style="font-size:18px;font-weight:700">${p.info.label}</div>`
```

Profile labels, session titles, alert details, and error messages are interpolated directly into HTML without escaping. If any profile metadata or session title contains `<script>` tags or HTML entities, they will be rendered in the exported HTML report.

**Fix:** Add an `escapeHtml()` utility and apply it to all user-controlled strings before HTML interpolation.

### 6.3 Shell Injection in Profile IDs

```typescript
// lib/insights.ts line 179
const svc = profileId === "amyn-main" ? "hermes-gateway.service" : `hermes-gateway-${profileId}.service`;
execSync(`systemctl --user is-active ${svc} 2>/dev/null`, ...)
```

`profileId` comes from the filesystem directory listing. If a directory name contains shell metacharacters (`;`, `|`, `$()`, etc.), this becomes a command injection vector. While profile IDs are currently controlled, this is a defense-in-depth gap.

**Fix:** Validate `profileId` against a whitelist pattern (e.g., `/^[a-z0-9-]+$/`) before using in shell commands. Better yet, use `execFileSync` with argument arrays to avoid shell interpretation.

### 6.4 SQL Injection in Daily Trend Query

```typescript
// lib/insights.ts line 212-213
WHERE started_at > strftime('%s', 'now', '-${days} days')
```

The `days` parameter is string-interpolated into the SQL query rather than using a parameterized query. While `days` is currently always `30` (hardcoded default), this is a latent injection vector if the parameter is ever user-controlled.

**Fix:** Use parameterized queries: `WHERE started_at > strftime('%s', 'now', '-' || ? || ' days')` with `[days]` as the parameter.

---

## 7. Code Quality

### 7.1 Dead Code (4 orphaned components)

These files are never imported by any other module:

| File | Lines | Purpose (superseded by) |
|------|-------|------------------------|
| `components/insights/overview.tsx` | 71 | Replaced by `MissionControl` |
| `components/insights/cost-table.tsx` | 116 | Replaced by `CFOView` in `CSuiteCockpit` |
| `components/insights/profile-cards.tsx` | 156 | Replaced by `ClientCenter` |
| `components/insights/error-analysis.tsx` | 177 | Replaced by `DeepIntel` |

**Total dead code: 520 lines.** Should be deleted to reduce confusion and maintenance burden.

### 7.2 Dead API Endpoints

| Endpoint | Called by frontend? | Recommendation |
|----------|-------------------|----------------|
| `GET /api/insights/profile/[id]` | ❌ No | Either wire up a UI consumer or delete |
| `GET /api/insights/export` | ❌ No | Either add an export button or delete |

### 7.3 `require()` in ESM Context

```typescript
// lib/insights.ts lines 178, 187
const { execSync } = require("child_process");
```

Using `require()` inside function bodies in a TypeScript/ESM project is a code smell. It defeats tree-shaking, breaks TypeScript type inference, and is inconsistent with the rest of the codebase which uses `import`.

**Fix:** Import `execSync` at the top of the file: `import { execSync } from "node:child_process"`.

### 7.4 Type Safety

- `queryDb` uses `as T[]` type assertions without runtime validation (line 152)
- `queryDbSingle` uses `as T | undefined` (line 161)
- `parseFloat(out.trim()) || 0` silently returns 0 for invalid output (line 195)
- No Zod schemas or runtime type validation on API responses

### 7.5 Error Handling

- `try/catch` blocks silently swallow errors with empty catch clauses (lines 145, 170, 196)
- `countErrorLines()` reads the entire error log into memory just to count lines — should use a streaming approach or `wc -l`
- `getProfileDeepDive()` silently returns partial data when dbPath doesn't exist (line 427)

### 7.6 Naming Inconsistency

The spec used component names that matched the file names in the original architecture:
- `overview.tsx` → now lives as inline `StatCard` in `mission-control.tsx`
- `cost-table.tsx` → now lives as `CFOView` in `c-suite.tsx`
- `profile-cards.tsx` → now lives as `ClientCenter` component
- `error-analysis.tsx` → now lives as `Recommendations` in `deep-intel.tsx`

The new tab-based components (`mission-control.tsx`, `c-suite.tsx`, `client-center.tsx`, `deep-intel.tsx`) are well-named and clearly structured. The issue is that the old components still exist.

---

## 8. Recommended Fixes

### Priority 1 — Critical (Fix Immediately)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1.1 | **Add `validateToken()` to all 3 insights API routes** | 15 min | Closes critical auth bypass |
| 1.2 | **HTML-escape user data in `generateHTMLReport()`** | 30 min | Prevents XSS in exported reports |
| 1.3 | **Validate profileId before shell interpolation** | 20 min | Prevents command injection |

### Priority 2 — High (Fix This Sprint)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 2.1 | **Delete 4 orphaned component files** | 5 min | Removes 520 lines of dead code |
| 2.2 | **Delete or wire up orphaned API endpoints** | 30 min | Either add UI for profile deep-dive + export, or remove dead backend |
| 2.3 | **Fix `getProfileDeepDive()` to avoid re-querying all profiles** | 45 min | Eliminates O(n²) data fetch |
| 2.4 | **Replace `require("child_process")` with top-level `import`** | 5 min | ESM consistency |
| 2.5 | **Use parameterized SQL for `days` parameter in daily trend query** | 10 min | Eliminates latent SQL injection |

### Priority 3 — Medium (Fix Before Next Release)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 3.1 | **Add ETag/conditional-get support to API routes** | 1 hr | Reduces bandwidth and re-render churn |
| 3.2 | **Make profile metadata dynamic** (read from config or db, not hardcoded) | 2 hr | Scalable profile management |
| 3.3 | **Add ARIA attributes to tab navigation** | 30 min | Accessibility compliance |
| 3.4 | **Fix tab button tap targets to ≥44px** | 10 min | AGENTS.md mobile-first rule |
| 3.5 | **Make timezone configurable** (don't hardcode America/New_York) | 30 min | Internationalization |
| 3.6 | **Replace `execSync` with async `exec` or `execFile`** | 1 hr | Non-blocking event loop |
| 3.7 | **Add an export button to the dashboard UI** | 1 hr | Completes the "Dual Delivery" pattern |

### Priority 4 — Low (Backlog)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 4.1 | **Evaluate recharts alternatives** for bundle size | 4 hr | Bundle optimization |
| 4.2 | **Add Zod validation** to API response types | 2 hr | Runtime type safety |
| 4.3 | **Consolidate redundant aggregation logic** in components | 2 hr | DRY principle |
| 4.4 | **Implement WebSocket/SSE for live updates** | 4 hr | Better UX than polling |
| 4.5 | **Add vitest tests** for `lib/insights.ts` | 3 hr | Regression safety |
| 4.6 | **Stream error log counting** instead of `readFileSync` | 30 min | Memory efficiency for large logs |

---

## Summary

The insights dashboard is a **solid functional implementation** of the in-scope features. The 4-tab architecture (Mission Control, C-Suite Cockpit, Client Center, Deep Intelligence) provides comprehensive visibility into the multi-profile Hermes fleet. The data layer (`lib/insights.ts`) handles profile discovery, statistical aggregation, anomaly detection, and alert generation competently.

**However, three issues demand immediate attention:**

1. **The insights API routes bypass authentication** — the only routes in the entire codebase without `validateToken()`. This is a critical security gap.
2. **520 lines of dead code** across 4 orphaned components from an earlier implementation iteration.
3. **Two backend features (profile deep-dive, HTML export) have no frontend consumers** — either wire them up or remove them.

The remaining gaps (performance, accessibility, code quality) are moderate and addressable within a focused sprint.
