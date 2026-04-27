import { listFiles } from "@/lib/vault";
import { IngestZone } from "@/components/sources/ingest-zone";
import { ProcessUnreadButton } from "@/components/sources/process-button";
import { ProcessRowButton } from "@/components/sources/process-row-button";
import { Card } from "@/components/ui/card";
import { getOrCreateToken } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES = [
  { key: "unread", label: "Unread", tone: "warn" },
  { key: "reading", label: "Reading", tone: "info" },
  { key: "processed", label: "Processed", tone: "ok" },
] as const;

const TONE_COLOR: Record<"warn" | "info" | "ok", string> = {
  warn: "bg-[hsl(var(--status-warn))]",
  info: "bg-[hsl(var(--status-info))]",
  ok: "bg-[hsl(var(--status-ok))]",
};

export default function SourcesPage() {
  const all = listFiles("sources");
  const grouped = {
    unread: all.filter((f) => !f.status || f.status === "unread"),
    reading: all.filter((f) => f.status === "reading"),
    processed: all.filter((f) => f.status === "processed"),
  };
  const token = getOrCreateToken();

  return (
    <div className="flex flex-col">
      <section className="hero-glow border-b border-[hsl(var(--border-default))] px-6 py-10">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg-secondary))]">
            Drop raw materials your AI C-suite reads from. Sources are
            read-only; the agent synthesizes them into wiki pages you review.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
            <span>
              <span className="text-[hsl(var(--fg-secondary))]">{all.length}</span> total
            </span>
            <span>
              <span className="text-[hsl(var(--status-warn))]">
                {grouped.unread.length}
              </span>{" "}
              unread
            </span>
            <span>
              <span className="text-[hsl(var(--status-ok))]">
                {grouped.processed.length}
              </span>{" "}
              processed
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          {/* Process all unread (only if there are any) */}
          {grouped.unread.length > 0 && (
            <ProcessUnreadButton
              unreadCount={grouped.unread.length}
              token={token}
            />
          )}

          {/* Ingest zone */}
          <IngestZone token={token} />

          {/* Three columns by status */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STATUSES.map(({ key, label, tone }) => (
              <Card key={key} className="overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${TONE_COLOR[tone]}`} />
                    <span className="label-uppercase">{label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">
                    {grouped[key].length}
                  </span>
                </div>
                <div className="px-5 pb-5">
                  {grouped[key].length === 0 ? (
                    <p className="text-sm text-[hsl(var(--fg-dim))]">
                      {key === "unread"
                        ? "Nothing to ingest."
                        : key === "reading"
                          ? "No active ingest runs."
                          : "Nothing processed yet."}
                    </p>
                  ) : (
                    <ul className="dense space-y-1">
                      {grouped[key].slice(0, 25).map((f) => (
                        <li
                          key={f.path}
                          className="group flex items-center justify-between gap-2"
                        >
                          <Link
                            href={`/wiki/${f.path.replace(/\.md$/, "")}`}
                            className="flex-1 truncate rounded px-2 py-1 text-sm text-[hsl(var(--fg-primary))] transition-colors hover:bg-[hsl(var(--bg-elevated))]"
                          >
                            {f.title}
                          </Link>
                          {key === "unread" ? (
                            <ProcessRowButton path={f.path} token={token} />
                          ) : f.created ? (
                            <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">
                              {f.created}
                            </span>
                          ) : null}
                        </li>
                      ))}
                      {grouped[key].length > 25 && (
                        <li className="px-2 py-1 text-[10px] text-[hsl(var(--fg-dim))]">
                          +{grouped[key].length - 25} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
