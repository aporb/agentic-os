"use client";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts";

export type VaultSparklinePoint = {
  date: string; // YYYY-MM-DD
  count: number;
};

function colorForBar(daysAgo: number): string {
  if (daysAgo === 0) return "hsl(var(--accent-base))";
  if (daysAgo < 7) return "hsl(var(--fg-dim))";
  return "hsl(var(--bg-inset))";
}

export function VaultSparkline({
  data,
  totalFiles,
}: {
  data: VaultSparklinePoint[];
  totalFiles: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayBar = data.find((d) => d.date === today);

  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="label-uppercase">Vault</span>
        <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">30d</span>
      </div>
      <div className="px-5 pb-3">
        <div className="data-callout">{totalFiles}</div>
        <div className="label-uppercase mt-1">
          {todayBar?.count ? `${todayBar.count} today` : "files in vault"}
        </div>
      </div>
      <div className="px-3 pb-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={1}>
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((point, i) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(point.date).getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return <Cell key={i} fill={colorForBar(daysAgo)} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
