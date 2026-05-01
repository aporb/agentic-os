"use client";

import { useState } from "react";
import type { InsightsResponse, ProfileData } from "@/lib/insights";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Radio,
} from "lucide-react";

type Props = { data: InsightsResponse };

function HealthBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="flex items-center gap-1 text-xs text-[hsl(var(--success))]">
        <Shield className="h-3 w-3" /> Healthy
      </span>
    );
  if (score >= 60)
    return (
      <span className="flex items-center gap-1 text-xs text-[hsl(var(--warning))]">
        <Shield className="h-3 w-3" /> Moderate
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-[hsl(var(--error))]">
      <Shield className="h-3 w-3" /> At Risk
    </span>
  );
}

function RiskBadge({ flag }: { flag: string }) {
  const labels: Record<string, string> = {
    critical_health: "Critical Health",
    high_errors: "High Errors",
    memory_pressure: "Memory",
    low_engagement: "Low Engagement",
  };
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]">
      {labels[flag] ?? flag}
    </span>
  );
}

function ClientCard({ profile }: { profile: ProfileData }) {
  const [expanded, setExpanded] = useState(false);
  const mps =
    profile.stats.sessions > 0
      ? (profile.stats.messages / profile.stats.sessions).toFixed(1)
      : "0";
  const lastActive = profile.stats.last_session
    ? new Date(profile.stats.last_session * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Never";
  const daysSinceLastSession = profile.stats.last_session
    ? Math.floor(
        (Date.now() / 1000 - profile.stats.last_session) / 86400
      )
    : null;

  const onboardingStatus =
    profile.info.role.includes("Onboarding") ? "Onboarding" : "Active";

  const engagementLevel =
    profile.stats.sessions === 0
      ? "Ghost"
      : profile.stats.messages / profile.stats.sessions < 5
        ? "Low"
        : profile.stats.messages / profile.stats.sessions < 20
          ? "Moderate"
          : "High";

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[hsl(var(--bg-page)/0.3)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {profile.info.label}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  onboardingStatus === "Active"
                    ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                    : "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                }`}
              >
                {onboardingStatus}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--fg-tertiary))]">
              <HealthBadge score={profile.health_score} />
              <span>·</span>
              <span>{engagementLevel} engagement</span>
              {daysSinceLastSession !== null && (
                <>
                  <span>·</span>
                  <span>Last active {lastActive}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile.risk_flags.length > 0 && (
            <div className="flex gap-1">
              {profile.risk_flags.slice(0, 2).map((f) => (
                <RiskBadge key={f} flag={f} />
              ))}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[hsl(var(--border-default))] p-4 space-y-4 bg-[hsl(var(--bg-page)/0.3)]">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase">
                Sessions
              </div>
              <div className="text-lg font-semibold">
                {profile.stats.sessions}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase">
                Messages
              </div>
              <div className="text-lg font-semibold">
                {profile.stats.messages}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase">
                Msgs/Session
              </div>
              <div className="text-lg font-semibold">{mps}</div>
            </div>
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase">
                Cost
              </div>
              <div className="text-lg font-semibold">
                ${profile.stats.cost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          {Object.keys(profile.sources).length > 0 && (
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase mb-2">
                Sources
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(profile.sources).map(([src, count]) => (
                  <span
                    key={src}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--bg-page))] text-[hsl(var(--fg-tertiary))]"
                  >
                    {src}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Model Usage */}
          {profile.model_usage.length > 0 && (
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase mb-2">
                Models
              </div>
              <div className="space-y-1">
                {profile.model_usage.map((m) => (
                  <div
                    key={m.model}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[hsl(var(--fg-tertiary))]">
                      {m.model}
                    </span>
                    <span>
                      {m.sessions} sessions · ${m.cost.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {profile.recent_sessions.length > 0 && (
            <div>
              <div className="text-[10px] text-[hsl(var(--fg-dim))] uppercase mb-2">
                Recent Sessions
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {profile.recent_sessions.slice(0, 5).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs border-b border-[hsl(var(--border-default))] pb-1.5 last:border-0"
                  >
                    <Clock className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--fg-tertiary))]" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.title}</div>
                      <div className="text-[hsl(var(--fg-tertiary))]">
                        {s.message_count} msgs · ${s.estimated_cost_usd.toFixed(3)} ·{" "}
                        {new Date(s.started_at * 1000).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ClientCenter({ data }: Props) {
  const sorted = [...data.profiles].sort((a, b) => a.health_score - b.health_score);
  const activeCount = sorted.filter((p) => p.info.role.includes("Active")).length;
  const onboardingCount = sorted.filter((p) =>
    p.info.role.includes("Onboarding")
  ).length;
  const ghostCount = sorted.filter((p) => p.stats.sessions === 0).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Total Clients
            </div>
            <div className="text-2xl font-bold mt-1">
              {data.totals.profiles - 1}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Active
            </div>
            <div className="text-2xl font-bold mt-1 text-[hsl(var(--success))]">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Onboarding
            </div>
            <div className="text-2xl font-bold mt-1 text-[hsl(var(--warning))]">
              {onboardingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-[hsl(var(--fg-tertiary))] uppercase">
              Ghost Profiles
            </div>
            <div className="text-2xl font-bold mt-1 text-[hsl(var(--fg-tertiary))]">
              {ghostCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Cards */}
      <div>
        <h3 className="text-sm font-semibold text-[hsl(var(--fg-tertiary))] uppercase tracking-wider mb-4">
          Client Health (sorted by risk)
        </h3>
        <div className="space-y-3">
          {sorted.map((p) => (
            <ClientCard key={p.info.id} profile={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
