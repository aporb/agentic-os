"use client";

import { useState, useEffect, useCallback } from "react";
import type { InsightsResponse } from "@/lib/insights";
import { MissionControl } from "./mission-control";
import { CSuiteCockpit } from "./c-suite";
import { ClientCenter } from "./client-center";
import { DeepIntel } from "./deep-intel";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Brain,
  RefreshCw,
} from "lucide-react";

const TABS = [
  { id: "mission", label: "Mission Control", icon: LayoutDashboard },
  { id: "csuite", label: "C-Suite Cockpit", icon: Briefcase },
  { id: "clients", label: "Client Center", icon: Users },
  { id: "intel", label: "Deep Intelligence", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("mission");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as InsightsResponse;
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--fg-tertiary))] text-sm">
          Loading insights…
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--error))] text-sm">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-[hsl(var(--fg-tertiary))] mt-1">
            Live multi-profile dashboard ·{" "}
            {new Date(data.timestamp).toLocaleString("en-US", {
              timeZone: "America/New_York",
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] text-xs text-[hsl(var(--fg-tertiary))] hover:text-[hsl(var(--fg-primary))] transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Alerts Banner */}
      {data.alerts.length > 0 && (
        <div className="mb-6 p-3 rounded-xl border border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error)/0.05)]">
          <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--error))]">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--error))] animate-pulse" />
            {data.alerts.filter((a) => a.severity === "critical").length > 0 && (
              <span>
                {data.alerts.filter((a) => a.severity === "critical").length}{" "}
                critical
              </span>
            )}
            {data.alerts.filter((a) => a.severity === "warning").length > 0 && (
              <span>
                {data.alerts.filter((a) => a.severity === "warning").length}{" "}
                warnings
              </span>
            )}
            <span className="text-[hsl(var(--fg-tertiary))]">
              · {data.alerts.length} total alerts
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-[hsl(var(--border-default))] overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-[hsl(var(--accent-base))] text-[hsl(var(--fg-primary))]"
                  : "border-transparent text-[hsl(var(--fg-tertiary))] hover:text-[hsl(var(--fg-secondary))]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "mission" && <MissionControl data={data} />}
        {tab === "csuite" && <CSuiteCockpit data={data} />}
        {tab === "clients" && <ClientCenter data={data} />}
        {tab === "intel" && <DeepIntel data={data} />}
      </div>
    </div>
  );
}
