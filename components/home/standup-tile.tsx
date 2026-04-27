import { Card } from "@/components/ui/card";
import Link from "next/link";

export type StandupBrief = {
  date: string;
  done: string[];
  doing: string[];
  blocked: string[];
  watch: string[];
  source?: "cached" | "fresh" | "missing";
};

export function StandupTile({ brief }: { brief: StandupBrief | null }) {
  if (!brief) {
    return (
      <Card className="flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="label-uppercase">Today's standup</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
          <p className="max-w-xs text-sm text-[hsl(var(--fg-secondary))]">
            No standup yet. Run it now or schedule it to be waiting when you
            open this.
          </p>
          <div className="flex gap-2">
            <Link
              href="/skills/ceo/daily-standup"
              className="inline-flex h-8 items-center rounded-md border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 text-xs font-medium text-[hsl(var(--fg-primary))] transition-colors hover:border-[hsl(var(--border-strong))]"
            >
              Run now
            </Link>
            <Link
              href="/automations"
              className="inline-flex h-8 items-center rounded-md border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 text-xs font-medium text-[hsl(var(--fg-secondary))] transition-colors hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--fg-primary))]"
            >
              Schedule
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="label-uppercase">Today's standup</span>
        <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">
          {brief.date}
        </span>
      </div>
      <div className="space-y-3 px-5 pb-5 text-sm">
        <Section label="Done" items={brief.done} color="ok" />
        <Section label="Doing" items={brief.doing} color="info" />
        <Section label="Blocked" items={brief.blocked} color="err" />
        <Section label="Watch" items={brief.watch} color="warn" />
        {brief.done.length === 0 &&
          brief.doing.length === 0 &&
          brief.blocked.length === 0 &&
          brief.watch.length === 0 && (
            <p className="text-xs text-[hsl(var(--fg-dim))]">
              The standup ran but produced no items. Try refeeding the vault.
            </p>
          )}
      </div>
    </Card>
  );
}

function Section({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: "ok" | "info" | "err" | "warn";
}) {
  if (items.length === 0) return null;
  const borderColor =
    color === "ok"
      ? "border-[hsl(var(--status-ok))]"
      : color === "info"
        ? "border-[hsl(var(--status-info))]"
        : color === "err"
          ? "border-[hsl(var(--status-err))]"
          : "border-[hsl(var(--status-warn))]";
  return (
    <div className={`border-l-2 pl-3 ${borderColor}`}>
      <div className="label-uppercase mb-1">{label}</div>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item, i) => (
          <li
            key={i}
            className="leading-snug text-[hsl(var(--fg-secondary))]"
          >
            {item}
          </li>
        ))}
        {items.length > 4 && (
          <li className="text-xs text-[hsl(var(--fg-dim))]">
            +{items.length - 4} more
          </li>
        )}
      </ul>
    </div>
  );
}
