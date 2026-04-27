import { Card } from "@/components/ui/card";
import type { HermesStatus, HermesSession, HermesJob } from "@/lib/hermes";
import { cn } from "@/lib/cn";

function formatRelative(then: Date, now = new Date()): string {
  const ms = then.getTime() - now.getTime();
  if (ms <= 0) return "now";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return `${h}h ${remM}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function HermesStatusTile({
  status,
  sessions,
  jobs,
}: {
  status: HermesStatus;
  sessions: HermesSession[];
  jobs: HermesJob[];
}) {
  const connected = status.platforms
    ? Object.entries(status.platforms)
        .filter(([, p]) => p.state === "connected")
        .map(([name]) => name)
    : [];

  // Find the next-running cron
  const nextJob = jobs
    .filter((j) => j.enabled && j.next_run_at)
    .sort((a, b) => (a.next_run_at ?? "").localeCompare(b.next_run_at ?? ""))[0];
  const nextDelta = nextJob ? formatRelative(new Date(nextJob.next_run_at!)) : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="label-uppercase">Hermes</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status.running
                ? "bg-[hsl(var(--status-ok))] status-pulsing"
                : "bg-[hsl(var(--status-err))]",
            )}
          />
          <span
            className={cn(
              "font-mono text-[10px]",
              status.running
                ? "text-[hsl(var(--status-ok))]"
                : "text-[hsl(var(--status-err))]",
            )}
          >
            {status.running ? "running" : "offline"}
          </span>
        </div>
      </div>

      {/* Big clock zone */}
      <div className="px-5 pb-5">
        {nextDelta ? (
          <div>
            <div className="data-callout">{nextDelta}</div>
            <div className="label-uppercase mt-1">
              Next run · {nextJob!.name}
            </div>
          </div>
        ) : (
          <div>
            <div className="data-callout text-[hsl(var(--fg-dim))]">—</div>
            <div className="label-uppercase mt-1">No scheduled runs</div>
          </div>
        )}
      </div>

      {/* Connected platforms */}
      {connected.length > 0 && (
        <div className="border-t border-[hsl(var(--border-subtle))] px-5 py-3 dense">
          <div className="flex flex-wrap items-center gap-1.5">
            {connected.map((p) => (
              <span
                key={p}
                className="inline-flex h-5 items-center rounded border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-1.5 font-mono text-[10px] text-[hsl(var(--fg-secondary))]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions, dense */}
      {sessions.length > 0 && (
        <div className="border-t border-[hsl(var(--border-subtle))] px-5 py-3 dense">
          <div className="label-uppercase mb-1.5">Recent sessions</div>
          <ul className="space-y-1">
            {sessions.slice(0, 3).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate text-[hsl(var(--fg-secondary))]">
                  {s.title ?? s.preview ?? s.id.slice(0, 12)}
                </span>
                <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))] shrink-0">
                  {s.source}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
