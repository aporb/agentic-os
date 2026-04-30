"use client";

import { Users, MessageSquare, DollarSign, Cpu } from "lucide-react";

type Props = {
  totals: {
    profiles: number;
    sessions: number;
    messages: number;
    cost: number;
    tokens: number;
  };
};

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
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.05)]"
          : "border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[hsl(var(--fg-tertiary))]" />
        <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export function InsightsOverview({ totals }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Profiles"
        value={String(totals.profiles)}
        accent
      />
      <StatCard
        icon={MessageSquare}
        label="Sessions"
        value={totals.sessions.toLocaleString()}
      />
      <StatCard
        icon={Cpu}
        label="Messages"
        value={totals.messages.toLocaleString()}
      />
      <StatCard
        icon={DollarSign}
        label="Total Spend"
        value={`$${totals.cost.toFixed(2)}`}
      />
    </div>
  );
}
