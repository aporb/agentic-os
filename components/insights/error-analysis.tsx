"use client";

import type { ProfileData } from "@/lib/insights";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";

type Props = {
  profiles: ProfileData[];
};

type Recommendation = {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

function analyzeProfile(p: ProfileData): Recommendation[] {
  const recs: Recommendation[] = [];

  // Memory pressure
  if (p.memory_mb > 300) {
    recs.push({
      severity: "critical",
      title: "High memory usage",
      detail: `${p.info.label} gateway at ${p.memory_mb.toFixed(0)}MB RSS. Consider reducing max_turns or compression threshold.`,
    });
  } else if (p.memory_mb > 200) {
    recs.push({
      severity: "warning",
      title: "Moderate memory usage",
      detail: `${p.info.label} gateway at ${p.memory_mb.toFixed(0)}MB RSS. Monitor for growth.`,
    });
  }

  // Error rate
  if (p.error_lines > 100) {
    recs.push({
      severity: "warning",
      title: "Elevated error count",
      detail: `${p.info.label} has ${p.error_lines} error lines. Check logs for patterns.`,
    });
  }

  // Ghost profile
  if (p.stats.sessions === 0) {
    recs.push({
      severity: "info",
      title: "Inactive profile",
      detail: `${p.info.label} has zero sessions. Gateway running but unused.`,
    });
  }

  // Low engagement
  if (p.stats.sessions > 0 && p.stats.messages / p.stats.sessions < 5) {
    recs.push({
      severity: "info",
      title: "Low engagement",
      detail: `${p.info.label} averages ${(p.stats.messages / p.stats.sessions).toFixed(1)} msgs/session. Consider proactive onboarding.`,
    });
  }

  return recs;
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-[hsl(var(--error))]" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />;
    default:
      return <CheckCircle className="h-4 w-4 text-[hsl(var(--accent))]" />;
  }
}

export function ErrorAnalysis({ profiles }: Props) {
  const allRecs = profiles.flatMap(analyzeProfile);
  const criticals = allRecs.filter((r) => r.severity === "critical");
  const warnings = allRecs.filter((r) => r.severity === "warning");
  const infos = allRecs.filter((r) => r.severity === "info");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Recommendations */}
      <div className="rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[hsl(var(--accent))]" />
          <h2 className="text-sm font-semibold">Recommendations</h2>
        </div>
        {allRecs.length === 0 ? (
          <div className="text-xs text-[hsl(var(--fg-tertiary))] italic">
            All systems healthy. No recommendations.
          </div>
        ) : (
          <div className="space-y-2">
            {criticals.map((r, i) => (
              <div
                key={`c${i}`}
                className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--error)/0.05)] border border-[hsl(var(--error)/0.2)]"
              >
                <SeverityIcon severity={r.severity} />
                <div>
                  <div className="text-xs font-medium">{r.title}</div>
                  <div className="text-xs text-[hsl(var(--fg-tertiary))]">
                    {r.detail}
                  </div>
                </div>
              </div>
            ))}
            {warnings.map((r, i) => (
              <div
                key={`w${i}`}
                className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--warning)/0.05)] border border-[hsl(var(--warning)/0.2)]"
              >
                <SeverityIcon severity={r.severity} />
                <div>
                  <div className="text-xs font-medium">{r.title}</div>
                  <div className="text-xs text-[hsl(var(--fg-tertiary))]">
                    {r.detail}
                  </div>
                </div>
              </div>
            ))}
            {infos.map((r, i) => (
              <div
                key={`i${i}`}
                className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--accent)/0.05)] border border-[hsl(var(--accent)/0.2)]"
              >
                <SeverityIcon severity={r.severity} />
                <div>
                  <div className="text-xs font-medium">{r.title}</div>
                  <div className="text-xs text-[hsl(var(--fg-tertiary))]">
                    {r.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error summary per profile */}
      <div className="rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] p-4">
        <h2 className="text-sm font-semibold mb-3">Error Summary</h2>
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.info.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{p.info.label}</span>
                <span
                  className={
                    p.error_lines > 100
                      ? "text-[hsl(var(--warning))]"
                      : "text-[hsl(var(--fg-tertiary))]"
                  }
                >
                  {p.error_lines} lines
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[hsl(var(--bg-page))] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((p.error_lines / 800) * 100, 100)}%`,
                    backgroundColor:
                      p.error_lines > 200
                        ? "hsl(var(--warning))"
                        : "hsl(var(--accent))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
