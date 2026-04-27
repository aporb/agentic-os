import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ActivityItem = {
  kind: "wiki-draft" | "wiki-reviewed" | "journal" | "source-unread" | "contradiction";
  title: string;
  path: string;
  date?: string;
};

function relativeDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const ms = Date.now() - d.getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const KIND_COLOR: Record<ActivityItem["kind"], string> = {
  "wiki-draft": "bg-[hsl(var(--status-warn))]",
  "wiki-reviewed": "bg-[hsl(var(--status-ok))]",
  journal: "bg-[hsl(var(--fg-dim))]",
  "source-unread": "bg-[hsl(var(--status-info))]",
  contradiction: "bg-[hsl(var(--status-err))]",
};

const KIND_LABEL: Record<ActivityItem["kind"], string> = {
  "wiki-draft": "draft",
  "wiki-reviewed": "reviewed",
  journal: "journal",
  "source-unread": "unread",
  contradiction: "conflict",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="label-uppercase">Vault activity</span>
        {items.length > 0 && (
          <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">
            {items.length}
          </span>
        )}
      </div>
      <div className="px-5 pb-5">
        {items.length === 0 ? (
          <div className="py-6 space-y-3 max-w-md">
            <p className="text-sm text-[hsl(var(--fg-secondary))]">
              The vault is quiet.
            </p>
            <p className="text-xs text-[hsl(var(--fg-dim))]">
              Skills write to it every time they run. Start with the daily
              standup — it takes 10 seconds and builds context for every skill
              that follows.
            </p>
            <Link
              href="/skills/ceo/daily-standup"
              className="inline-flex h-8 items-center rounded-md bg-[hsl(var(--accent-base))] px-3 text-xs font-medium text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
            >
              Run daily standup
            </Link>
          </div>
        ) : (
          <ul className="relative space-y-2">
            {/* timeline rail */}
            <span className="absolute left-1.5 top-2 bottom-2 w-px bg-[hsl(var(--border-subtle))]" />
            {items.map((it, i) => {
              const slug = it.path.replace(/\.md$/, "");
              const href =
                it.path.startsWith("wiki/") || it.path.startsWith("journal/") || it.path.startsWith("sources/")
                  ? `/wiki/${slug.replace(/^wiki\//, "")}`
                  : `/wiki/${slug}`;
              return (
                <li
                  key={i}
                  className="relative flex items-start gap-3 pl-5 dense"
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[hsl(var(--bg-surface))]",
                      KIND_COLOR[it.kind],
                    )}
                  />
                  <Link
                    href={href}
                    className="flex flex-1 items-baseline justify-between gap-3 text-sm hover:text-[hsl(var(--accent-base))] transition-colors"
                  >
                    <span className="truncate">{it.title}</span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="text-[10px] text-[hsl(var(--fg-dim))]">
                        {KIND_LABEL[it.kind]}
                      </span>
                      <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">
                        {relativeDate(it.date)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
