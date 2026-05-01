"use client";

import type { InsightsResponse, ProfileData } from "@/lib/insights";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  MessageSquare,
  DollarSign,
  Cpu,
  Activity,
  Radio,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

type Props = { data: InsightsResponse };

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-[hsl(var(--accent)/0.3)]" : ""}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
            {label}
          </span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function FleetRow({ profile }: { profile: ProfileData }) {
  const healthColor =
    profile.health_score >= 80
      ? "text-[hsl(var(--success))]"
      : profile.health_score >= 60
        ? "text-[hsl(var(--warning))]"
        : "text-[hsl(var(--error))]";
  const memColor =
    profile.memory_mb > 300
      ? "text-[hsl(var(--error))]"
      : profile.memory_mb > 200
        ? "text-[hsl(var(--warning))]"
        : "text-[hsl(var(--success))]";

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-page)/0.5)] transition-colors">
      {/* Profile info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {profile.info.label}
          </span>
          <span className="text-[10px] text-[hsl(var(--fg-dim))]">
            {profile.info.role.split(" ")[0]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--fg-tertiary))]">
          <span className="flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                profile.gateway_status === "active"
                  ? "bg-[hsl(var(--success))]"
                  : "bg-[hsl(var(--error))]"
              }`}
            />
            {profile.gateway_status}
          </span>
          <span>{profile.stats.sessions} sessions</span>
          <span>{profile.stats.messages} msgs</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs">
        <span className={`flex items-center gap-1 ${healthColor}`}>
          <Shield className="h-3 w-3" />
          {profile.health_score}
        </span>
        {profile.memory_mb > 0 && (
          <span className={`flex items-center gap-1 ${memColor}`}>
            <Radio className="h-3 w-3" />
            {profile.memory_mb.toFixed(0)}MB
          </span>
        )}
        <span className="text-[hsl(var(--fg-tertiary))]">
          ${profile.stats.cost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function DailySpendChart({ data }: Props) {
  // Aggregate daily spend across all profiles
  const dayMap = new Map<string, number>();
  for (const p of data.profiles) {
    for (const d of p.daily_trend) {
      dayMap.set(d.day, (dayMap.get(d.day) ?? 0) + d.cost);
    }
  }
  const chartData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, cost]) => ({
      day: day.slice(5),
      cost: Math.round(cost * 1000) / 1000,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spend (14d)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
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
                formatter={(v: number) => [`$${v.toFixed(3)}`, "Spend"]}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(196, 100%, 50%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceDistribution({ data }: Props) {
  const sourceMap = new Map<string, number>();
  for (const p of data.profiles) {
    for (const [src, count] of Object.entries(p.sources)) {
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + count);
    }
  }
  const chartData = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const colors: Record<string, string> = {
    telegram: "hsl(196, 100%, 50%)",
    cron: "hsl(142, 71%, 45%)",
    api_server: "hsl(38, 92%, 50%)",
    cli: "hsl(270, 50%, 60%)",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <rect
                    key={entry.source}
                    fill={colors[entry.source] ?? "#666"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ data }: Props) {
  if (data.alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[hsl(var(--fg-tertiary))] italic">
            All systems healthy. No active alerts.
          </div>
        </CardContent>
      </Card>
    );
  }

  const sevColor = (s: string) =>
    s === "critical"
      ? "border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error)/0.05)]"
      : s === "warning"
        ? "border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]"
        : "border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.05)]";

  const sevIcon = (s: string) =>
    s === "critical" ? (
      <AlertTriangle className="h-4 w-4 text-[hsl(var(--error))]" />
    ) : s === "warning" ? (
      <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
    ) : (
      <Shield className="h-4 w-4 text-[hsl(var(--accent))]" />
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.alerts.slice(0, 8).map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${sevColor(alert.severity)}`}
          >
            {sevIcon(alert.severity)}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{alert.title}</div>
              <div className="text-xs text-[hsl(var(--fg-tertiary))] mt-0.5">
                {alert.detail}
              </div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] mt-1">
                {alert.profileId}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MissionControl({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Profiles"
          value={String(data.totals.profiles)}
          accent
        />
        <StatCard
          icon={MessageSquare}
          label="Sessions"
          value={data.totals.sessions.toLocaleString()}
        />
        <StatCard
          icon={Cpu}
          label="Messages"
          value={data.totals.messages.toLocaleString()}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spend"
          value={`$${data.totals.cost.toFixed(2)}`}
        />
      </div>

      {/* Billing Accuracy */}
      {data.billing && data.billing.total_credits > 0 && (
        <Card className="border-[hsl(var(--accent)/0.3)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
              OpenRouter Billing (Live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-1">
                  Estimated
                </div>
                <div className="text-lg font-bold">
                  ${data.totals.cost.toFixed(2)}
                </div>
                <div className="text-[10px] text-[hsl(var(--fg-tertiary))]">
                  Hermes (live model prices)
                </div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-1">
                  Actual (OpenRouter)
                </div>
                <div className="text-lg font-bold text-[hsl(var(--accent))]">
                  ${(data.billing.total_credits * 0.01).toFixed(2)}
                </div>
                <div className="text-[10px] text-[hsl(var(--fg-tertiary))]">
                  @ $0.01/credit · {data.billing.total_credits.toFixed(0)} credits
                </div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-1">
                  Variance
                </div>
                <div className={`text-lg font-bold ${(() => {
                  const actual = data.billing.total_credits * 0.01;
                  const diff = data.totals.cost - actual;
                  const pct = actual > 0 ? (diff / actual) * 100 : 0;
                  return Math.abs(pct) < 10 ? "text-green-400" : "text-yellow-400";
                })()}`}>
                  {(() => {
                    const actual = data.billing.total_credits * 0.01;
                    const diff = data.totals.cost - actual;
                    const pct = actual > 0 ? (diff / actual) * 100 : 0;
                    return `${diff >= 0 ? "+" : ""}$${diff.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
                  })()}
                </div>
                <div className="text-[10px] text-[hsl(var(--fg-tertiary))]">
                  Estimate vs OpenRouter billing
                </div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-1">
                  24h / 7d / 30d
                </div>
                <div className="text-lg font-bold">
                  ${data.billing.daily_credits.toFixed(2)} / ${data.billing.weekly_credits.toFixed(2)} / ${data.billing.monthly_credits.toFixed(2)}
                </div>
                <div className="text-[10px] text-[hsl(var(--fg-tertiary))]">
                  Last synced: {data.billing.last_updated ? new Date(data.billing.last_updated).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "never"} ET
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.profiles
            .sort((a, b) => a.health_score - b.health_score)
            .map((p) => (
              <FleetRow key={p.info.id} profile={p} />
            ))}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailySpendChart data={data} />
        <SourceDistribution data={data} />
      </div>

      {/* Alerts */}
      <AlertsPanel data={data} />
    </div>
  );
}
