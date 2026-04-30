"use client";

import type { ProfileData } from "@/lib/insights";
import {
  Activity,
  Radio,
  AlertTriangle,
  Zap,
  Clock,
} from "lucide-react";

type Props = {
  profiles: ProfileData[];
};

function GatewayBadge({ status }: { status: string }) {
  const isUp = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isUp ? "text-[hsl(var(--success))]" : "text-[hsl(var(--error))]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isUp ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--error))]"}`} />
      {isUp ? "Active" : status}
    </span>
  );
}

function SourceBadges({ sources }: { sources: Record<string, number> }) {
  const colors: Record<string, string> = {
    telegram: "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]",
    cron: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]",
    api_server: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]",
    cli: "bg-[hsl(var(--bg-page))] text-[hsl(var(--fg-tertiary))]",
  };
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Object.entries(sources).map(([src, count]) => (
        <span
          key={src}
          className={`px-2 py-0.5 rounded text-[0.65rem] font-medium ${
            colors[src] ?? "bg-[hsl(var(--bg-page))] text-[hsl(var(--fg-tertiary))]"
          }`}
        >
          {src}: {count}
        </span>
      ))}
    </div>
  );
}

function MiniSessionList({
  sessions,
}: {
  sessions: ProfileData["recent_sessions"];
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-xs text-[hsl(var(--fg-tertiary))] italic mt-3">
        No sessions yet
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-1.5 max-h-[160px] overflow-y-auto">
      {sessions.slice(0, 5).map((s, i) => (
        <div
          key={i}
          className="flex items-start gap-2 text-xs border-b border-[hsl(var(--border-default))] pb-1.5 last:border-0"
        >
          <Clock className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--fg-tertiary))]" />
          <div className="min-w-0">
            <div className="font-medium truncate">{s.title}</div>
            <div className="text-[hsl(var(--fg-tertiary))]">
              {s.message_count} msgs · ${s.estimated_cost_usd.toFixed(3)} ·{" "}
              {new Date(s.started_at * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileCards({ profiles }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-4">Profile Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((p) => {
          const memColor =
            p.memory_mb > 300
              ? "text-[hsl(var(--error))]"
              : p.memory_mb > 200
              ? "text-[hsl(var(--warning))]"
              : "text-[hsl(var(--success))]";
          return (
            <div
              key={p.info.id}
              className="rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{p.info.label}</h3>
                  <div className="text-xs text-[hsl(var(--fg-tertiary))] mt-0.5">
                    {p.info.role}
                  </div>
                </div>
                <GatewayBadge status={p.gateway_status} />
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--fg-tertiary))] mt-2">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {p.stats.sessions} sessions
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {p.stats.api_calls} API calls
                </span>
                {p.memory_mb > 0 && (
                  <span className={`flex items-center gap-1 ${memColor}`}>
                    <Radio className="h-3 w-3" />
                    {p.memory_mb.toFixed(0)} MB
                  </span>
                )}
              </div>

              {/* Sources */}
              {Object.keys(p.sources).length > 0 && (
                <SourceBadges sources={p.sources} />
              )}

              {/* Recent sessions */}
              <MiniSessionList sessions={p.recent_sessions} />

              {/* Errors */}
              {p.error_lines > 50 && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-[hsl(var(--warning))]">
                  <AlertTriangle className="h-3 w-3" />
                  {p.error_lines} error lines in logs
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
