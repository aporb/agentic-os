"use client";

import type { ProfileData } from "@/lib/insights";

type Props = {
  profiles: ProfileData[];
  totalCost: number;
};

function CostBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-[hsl(var(--bg-page))] overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(var(--accent))]"
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>
      <span className="text-xs text-[hsl(var(--fg-tertiary))] min-w-[36px] text-right">
        {pct < 1 ? "<1" : pct.toFixed(0)}%
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    "Superadmin / Operator":
      "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]",
    "Client (Active)":
      "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]",
    "Client (Onboarding)":
      "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase ${
        colors[role] ?? "bg-[hsl(var(--bg-page))] text-[hsl(var(--fg-tertiary))]"
      }`}
    >
      {role.split(" ")[0]}
    </span>
  );
}

export function CostTable({ profiles, totalCost }: Props) {
  const sorted = [...profiles].sort((a, b) => b.stats.cost - a.stats.cost);

  return (
    <div className="rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] overflow-hidden">
      <div className="p-4 border-b border-[hsl(var(--border-default))]">
        <h2 className="text-sm font-semibold">Cost Distribution</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border-default))]">
              <th className="text-left p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Profile
              </th>
              <th className="text-right p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Sessions
              </th>
              <th className="text-right p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Messages
              </th>
              <th className="text-right p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Tokens
              </th>
              <th className="text-right p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))]">
                Cost
              </th>
              <th className="p-3 text-xs font-medium uppercase tracking-wider text-[hsl(var(--fg-tertiary))] min-w-[140px]">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const pct = totalCost > 0 ? (p.stats.cost / totalCost) * 100 : 0;
              const tokens = p.stats.input_tokens + p.stats.output_tokens;
              return (
                <tr
                  key={p.info.id}
                  className="border-b border-[hsl(var(--border-default))] last:border-0 hover:bg-[hsl(var(--bg-page)/0.5)]"
                >
                  <td className="p-3">
                    <div className="font-medium">{p.info.label}</div>
                    <RoleBadge role={p.info.role} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {p.stats.sessions}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {p.stats.messages.toLocaleString()}
                  </td>
                  <td className="p-3 text-right tabular-nums text-[hsl(var(--fg-tertiary))]">
                    {tokens >= 1e6
                      ? `${(tokens / 1e6).toFixed(1)}M`
                      : `${(tokens / 1e3).toFixed(0)}K`}
                  </td>
                  <td className="p-3 text-right font-medium tabular-nums">
                    ${p.stats.cost.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <CostBar pct={pct} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
