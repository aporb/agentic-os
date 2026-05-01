"use client";

import { useState } from "react";
import type { InsightsResponse } from "@/lib/insights";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Server,
  Megaphone,
  Users,
  Brain,
  BarChart3,
  Zap,
  Target,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Props = { data: InsightsResponse };

// ---------------------------------------------------------------------------
// CEO View
// ---------------------------------------------------------------------------

function CEOView({ data }: Props) {
  const totalSessions = data.totals.sessions;
  const totalMsgs = data.totals.messages;
  const totalCost = data.totals.cost;
  const activeProfiles = data.profiles.filter(
    (p) => p.stats.sessions > 0
  ).length;
  const avgHealth =
    data.profiles.reduce((s, p) => s + p.health_score, 0) /
    data.profiles.length;

  // Session velocity (sessions per day, last 7d)
  const dayMap = new Map<string, number>();
  for (const p of data.profiles) {
    for (const d of p.daily_trend.slice(-7)) {
      dayMap.set(d.day, (dayMap.get(d.day) ?? 0) + d.sessions);
    }
  }
  const avgSessionsPerDay =
    dayMap.size > 0
      ? Array.from(dayMap.values()).reduce((a, b) => a + b, 0) / dayMap.size
      : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider">
        CEO — Strategic Overview
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Active Profiles
              </span>
            </div>
            <div className="text-2xl font-bold">{activeProfiles}</div>
            <div className="text-xs text-[hsl(var(--fg-tertiary))]">
              of {data.totals.profiles} total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Session Velocity
              </span>
            </div>
            <div className="text-2xl font-bold">
              {avgSessionsPerDay.toFixed(1)}
            </div>
            <div className="text-xs text-[hsl(var(--fg-tertiary))]">
              avg sessions/day (7d)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Fleet Health
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${
                avgHealth >= 80
                  ? "text-[hsl(var(--success))]"
                  : avgHealth >= 60
                    ? "text-[hsl(var(--warning))]"
                    : "text-[hsl(var(--error))]"
              }`}
            >
              {avgHealth.toFixed(0)}
            </div>
            <div className="text-xs text-[hsl(var(--fg-tertiary))]">
              avg health score
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Total Value
              </span>
            </div>
            <div className="text-2xl font-bold">
              {totalMsgs.toLocaleString()}
            </div>
            <div className="text-xs text-[hsl(var(--fg-tertiary))]">
              messages processed
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CFO View
// ---------------------------------------------------------------------------

function CFOView({ data }: Props) {
  const totalCost = data.totals.cost;
  const totalMsgs = data.totals.messages;
  const totalTokens = data.totals.tokens;

  const costPerSession =
    data.totals.sessions > 0 ? totalCost / data.totals.sessions : 0;
  const costPerMessage = totalMsgs > 0 ? totalCost / totalMsgs : 0;
  const costPerMillionTokens =
    totalTokens > 0 ? (totalCost / totalTokens) * 1_000_000 : 0;

  // Model cost breakdown
  const modelMap = new Map<string, { sessions: number; cost: number }>();
  for (const p of data.profiles) {
    for (const m of p.model_usage) {
      const existing = modelMap.get(m.model) ?? { sessions: 0, cost: 0 };
      modelMap.set(m.model, {
        sessions: existing.sessions + m.sessions,
        cost: existing.cost + m.cost,
      });
    }
  }
  const modelData = Array.from(modelMap.entries())
    .map(([model, v]) => ({
      model: model.length > 20 ? model.slice(0, 18) + "…" : model,
      sessions: v.sessions,
      cost: Math.round(v.cost * 1000) / 1000,
    }))
    .sort((a, b) => b.cost - a.cost);

  const COLORS = [
    "hsl(196, 100%, 50%)",
    "hsl(142, 71%, 45%)",
    "hsl(38, 92%, 50%)",
    "hsl(270, 50%, 60%)",
    "hsl(340, 75%, 55%)",
    "hsl(210, 100%, 56%)",
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider">
        CFO — Unit Economics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Cost/Session
            </div>
            <div className="text-2xl font-bold mt-1">
              ${costPerSession.toFixed(3)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Cost/Message
            </div>
            <div className="text-2xl font-bold mt-1">
              ${costPerMessage.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Cost/M Tokens
            </div>
            <div className="text-2xl font-bold mt-1">
              ${costPerMillionTokens.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Total Spend
            </div>
            <div className="text-2xl font-bold mt-1">
              ${totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: "#888", fontSize: 9 }}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 10 }}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #333",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toFixed(3)}`, "Cost"]}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {modelData.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelData}
                    dataKey="sessions"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ model, percent }) =>
                      `${model} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {modelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #333",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CTO View
// ---------------------------------------------------------------------------

function CTOView({ data }: Props) {
  const totalErrors = data.profiles.reduce((s, p) => s + p.error_lines, 0);
  const avgMem =
    data.profiles.reduce((s, p) => s + p.memory_mb, 0) / data.profiles.length;
  const upGateways = data.profiles.filter(
    (p) => p.gateway_status === "active"
  ).length;
  const totalAlerts = data.alerts.length;
  const criticalAlerts = data.alerts.filter(
    (a) => a.severity === "critical"
  ).length;

  // Error distribution
  const errorData = data.profiles
    .filter((p) => p.error_lines > 0)
    .map((p) => ({
      profile: p.info.label.split(" ")[0],
      errors: p.error_lines,
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider">
        CTO — System Health
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Gateways Up
            </div>
            <div className="text-2xl font-bold mt-1 text-[hsl(var(--success))]">
              {upGateways}/{data.profiles.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Total Errors
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                totalErrors > 200
                  ? "text-[hsl(var(--error))]"
                  : "text-[hsl(var(--fg-primary))]"
              }`}
            >
              {totalErrors}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Avg Memory
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                avgMem > 300
                  ? "text-[hsl(var(--error))]"
                  : avgMem > 200
                    ? "text-[hsl(var(--warning))]"
                    : "text-[hsl(var(--fg-primary))]"
              }`}
            >
              {avgMem.toFixed(0)}MB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Active Alerts
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                criticalAlerts > 0
                  ? "text-[hsl(var(--error))]"
                  : "text-[hsl(var(--fg-primary))]"
              }`}
            >
              {totalAlerts}
            </div>
            {criticalAlerts > 0 && (
              <div className="text-xs text-[hsl(var(--error))]">
                {criticalAlerts} critical
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Distribution */}
      {errorData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorData.map((d) => (
                <div key={d.profile}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{d.profile}</span>
                    <span
                      className={
                        d.errors > 100
                          ? "text-[hsl(var(--error))]"
                          : "text-[hsl(var(--fg-tertiary))]"
                      }
                    >
                      {d.errors} lines
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[hsl(var(--bg-page))]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((d.errors / 500) * 100, 100)}%`,
                        backgroundColor:
                          d.errors > 200
                            ? "hsl(var(--error))"
                            : d.errors > 100
                              ? "hsl(var(--warning))"
                              : "hsl(var(--accent))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CMO + CPO + CAIO Combined View
// ---------------------------------------------------------------------------

function CombinedView({ data }: Props) {
  // Hour-of-day heatmap (aggregated)
  const hourMap = new Map<number, number>();
  for (const p of data.profiles) {
    for (const h of p.hour_pattern) {
      hourMap.set(h.hour, (hourMap.get(h.hour) ?? 0) + h.sessions);
    }
  }
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sessions: hourMap.get(i) ?? 0,
  }));
  const maxHour = Math.max(...hourData.map((d) => d.sessions), 1);

  // Platform distribution
  const platformMap = new Map<string, number>();
  for (const p of data.profiles) {
    for (const [src, count] of Object.entries(p.sources)) {
      platformMap.set(src, (platformMap.get(src) ?? 0) + count);
    }
  }
  const platformData = Array.from(platformMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Engagement by profile
  const engagementData = data.profiles
    .filter((p) => p.stats.sessions > 0)
    .map((p) => ({
      profile: p.info.label.split(" ")[0],
      msgs_per_session: Math.round(p.stats.messages / p.stats.sessions),
      sessions: p.stats.sessions,
    }));

  return (
    <div className="space-y-6">
      {/* CMO */}
      <div>
        <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-4">
          CMO — Activity Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Hour-of-Day Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: "#888", fontSize: 9 }}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fill: "#888", fontSize: 10 }}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid #333",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="sessions" fill="hsl(196, 100%, 50%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformData.map((d) => (
                  <div key={d.source}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{d.source}</span>
                      <span className="text-[hsl(var(--fg-tertiary))]">
                        {d.count} sessions
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[hsl(var(--bg-page))]">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--accent))]"
                        style={{
                          width: `${(d.count / platformData[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CPO */}
      <div>
        <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-4">
          CPO — Client Engagement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement (Messages/Session)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="profile"
                      tick={{ fill: "#888", fontSize: 10 }}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid #333",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="msgs_per_session" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {engagementData.map((d) => (
                  <div key={d.profile}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{d.profile}</span>
                      <span className="text-[hsl(var(--fg-tertiary))]">
                        {d.sessions} sessions
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[hsl(var(--bg-page))]">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--success))]"
                        style={{
                          width: `${(d.sessions / Math.max(...engagementData.map((e) => e.sessions))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function CSuiteCockpit({ data }: Props) {
  const [view, setView] = useState<"ceo" | "cfo" | "cto" | "combined">("ceo");

  const views = [
    { id: "ceo" as const, label: "CEO", icon: Target },
    { id: "cfo" as const, label: "CFO", icon: DollarSign },
    { id: "cto" as const, label: "CTO", icon: Server },
    { id: "combined" as const, label: "CMO/CPO/CAIO", icon: Brain },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[hsl(var(--border-default))]">
        {views.map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                active
                  ? "border-[hsl(var(--accent-base))] text-[hsl(var(--fg-primary))]"
                  : "border-transparent text-[hsl(var(--fg-tertiary))] hover:text-[hsl(var(--fg-secondary))]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      {view === "ceo" && <CEOView data={data} />}
      {view === "cfo" && <CFOView data={data} />}
      {view === "cto" && <CTOView data={data} />}
      {view === "combined" && <CombinedView data={data} />}
    </div>
  );
}


