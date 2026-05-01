"use client";

import type { InsightsResponse } from "@/lib/insights";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Lightbulb,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Props = { data: InsightsResponse };

function TrendAnalysis({ data }: Props) {
  // Aggregate daily trends across profiles
  const dayMap = new Map<string, { sessions: number; messages: number; cost: number }>();
  for (const p of data.profiles) {
    for (const d of p.daily_trend) {
      const existing = dayMap.get(d.day) ?? { sessions: 0, messages: 0, cost: 0 };
      dayMap.set(d.day, {
        sessions: existing.sessions + d.sessions,
        messages: existing.messages + d.messages,
        cost: existing.cost + d.cost,
      });
    }
  }
  const chartData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([day, v]) => ({
      day: day.slice(5),
      sessions: v.sessions,
      messages: v.messages,
      cost: Math.round(v.cost * 1000) / 1000,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>30-Day Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
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
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#888" }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="hsl(196, 100%, 50%)"
                strokeWidth={2}
                dot={false}
                name="Sessions"
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={false}
                name="Messages"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AnomalyDetection({ data }: Props) {
  type Anomaly = {
    type: "cost_spike" | "engagement_drop" | "error_surge" | "memory_spike";
    profile: string;
    detail: string;
    severity: "critical" | "warning" | "info";
  };

  const anomalies: Anomaly[] = [];

  // Check for cost spikes (day-over-day > 200%)
  for (const p of data.profiles) {
    const trend = p.daily_trend;
    if (trend.length >= 2) {
      const latest = trend[trend.length - 1];
      const prev = trend[trend.length - 2];
      if (prev.cost > 0 && latest.cost / prev.cost > 2) {
        anomalies.push({
          type: "cost_spike",
          profile: p.info.label,
          detail: `Cost spiked ${((latest.cost / prev.cost) * 100).toFixed(0)}% day-over-day ($${prev.cost.toFixed(3)} → $${latest.cost.toFixed(3)})`,
          severity: latest.cost / prev.cost > 3 ? "critical" : "warning",
        });
      }
    }
  }

  // Check for engagement drops (recent 7d vs prior 7d)
  for (const p of data.profiles) {
    const trend = p.daily_trend;
    if (trend.length >= 14) {
      const recent = trend.slice(-7).reduce((s, d) => s + d.sessions, 0) / 7;
      const prior = trend.slice(-14, -7).reduce((s, d) => s + d.sessions, 0) / 7;
      if (prior > 0 && recent / prior < 0.5) {
        anomalies.push({
          type: "engagement_drop",
          profile: p.info.label,
          detail: `Sessions dropped ${((1 - recent / prior) * 100).toFixed(0)}% over last 7 days`,
          severity: "warning",
        });
      }
    }
  }

  // Check for error surges
  for (const p of data.profiles) {
    if (p.error_lines > 200) {
      anomalies.push({
        type: "error_surge",
        profile: p.info.label,
        detail: `${p.error_lines} error log lines — exceeds threshold`,
        severity: "critical",
      });
    } else if (p.error_lines > 100) {
      anomalies.push({
        type: "error_surge",
        profile: p.info.label,
        detail: `${p.error_lines} error log lines — monitor closely`,
        severity: "warning",
      });
    }
  }

  // Check for memory spikes
  for (const p of data.profiles) {
    if (p.memory_mb > 300) {
      anomalies.push({
        type: "memory_spike",
        profile: p.info.label,
        detail: `Gateway at ${p.memory_mb.toFixed(0)}MB RSS — risk of OOM`,
        severity: "critical",
      });
    }
  }

  if (anomalies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))]">
            <Shield className="h-4 w-4" />
            No anomalies detected. All metrics within normal ranges.
          </div>
        </CardContent>
      </Card>
    );
  }

  const severityColor = (s: string) =>
    s === "critical"
      ? "border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error)/0.05)]"
      : s === "warning"
        ? "border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]"
        : "border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.05)]";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {anomalies.map((a, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border ${severityColor(a.severity)}`}
          >
            {a.severity === "critical" ? (
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--error))] mt-0.5" />
            ) : (
              <Activity className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5" />
            )}
            <div>
              <div className="text-sm font-medium">{a.profile}</div>
              <div className="text-xs text-[hsl(var(--fg-tertiary))] mt-0.5">
                {a.detail}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Recommendations({ data }: Props) {
  type Rec = {
    title: string;
    detail: string;
    action: string;
    severity: "critical" | "warning" | "info";
  };

  const recs: Rec[] = [];

  // Memory pressure
  for (const p of data.profiles) {
    if (p.memory_mb > 300) {
      recs.push({
        title: `Restart ${p.info.label} gateway`,
        detail: `Memory at ${p.memory_mb.toFixed(0)}MB RSS. Restart to prevent OOM.`,
        action: "systemctl --user restart hermes-gateway-" + p.info.id,
        severity: "critical",
      });
    }
  }

  // Ghost profiles
  for (const p of data.profiles) {
    if (p.stats.sessions === 0 && p.info.id !== "amyn-main") {
      recs.push({
        title: `Check on ${p.info.label}`,
        detail: "Zero sessions. Profile created but unused.",
        action: "Send onboarding message via Telegram",
        severity: "info",
      });
    }
  }

  // Low engagement
  for (const p of data.profiles) {
    if (p.stats.sessions > 0 && p.stats.messages / p.stats.sessions < 5 && p.info.id !== "amyn-main") {
      recs.push({
        title: `Boost engagement for ${p.info.label}`,
        detail: `Averages ${(p.stats.messages / p.stats.sessions).toFixed(1)} msgs/session. Consider proactive outreach.`,
        action: "Send follow-up message",
        severity: "warning",
      });
    }
  }

  // High error rates
  for (const p of data.profiles) {
    if (p.error_lines > 100) {
      recs.push({
        title: `Review errors for ${p.info.label}`,
        detail: `${p.error_lines} error log lines. May indicate configuration issues.`,
        action: "Check logs: cat ~/.hermes/profiles/" + p.info.id + "/logs/errors.log | tail -50",
        severity: "warning",
      });
    }
  }

  // Cost optimization
  for (const p of data.profiles) {
    if (p.model_usage.length > 1) {
      const cheapestModel = p.model_usage.reduce((a, b) =>
        a.cost / a.sessions < b.cost / b.sessions ? a : b
      );
      const mostUsedModel = p.model_usage.reduce((a, b) =>
        a.sessions > b.sessions ? a : b
      );
      if (cheapestModel.model !== mostUsedModel.model && mostUsedModel.sessions > 5) {
        recs.push({
          title: `Consider switching ${p.info.label} to ${cheapestModel.model}`,
          detail: `Currently using ${mostUsedModel.model} (${mostUsedModel.sessions} sessions). ${cheapestModel.model} is ${((1 - (cheapestModel.cost / cheapestModel.sessions) / (mostUsedModel.cost / mostUsedModel.sessions)) * 100).toFixed(0)}% cheaper per session.`,
          action: "Update model config",
          severity: "info",
        });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[hsl(var(--warning))]" />
            Recommendations
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.length === 0 ? (
          <div className="text-sm text-[hsl(var(--fg-tertiary))] italic">
            No recommendations at this time. All systems optimized.
          </div>
        ) : (
          recs.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                r.severity === "critical"
                  ? "border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error)/0.05)]"
                  : r.severity === "warning"
                    ? "border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]"
                    : "border-[hsl(var(--border-default))]"
              }`}
            >
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-[hsl(var(--fg-tertiary))] mt-0.5">
                {r.detail}
              </div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] mt-1 font-mono">
                → {r.action}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DeepIntel({ data }: Props) {
  return (
    <div className="space-y-6">
      <TrendAnalysis data={data} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnomalyDetection data={data} />
        <Recommendations data={data} />
      </div>
    </div>
  );
}
