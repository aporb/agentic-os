import { tree, listFiles } from "@/lib/vault";
import { WikiTree } from "@/components/wiki/tree";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

function relativeDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WikiIndex() {
  const root = tree();
  const allFiles = listFiles("wiki");
  const recent = allFiles
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""))
    .slice(0, 8);
  const drafts = allFiles.filter((f) => f.status === "draft").length;
  const reviewed = allFiles.filter((f) => f.status === "reviewed").length;

  return (
    <div className="flex flex-col">
      <section className="hero-glow border-b border-[hsl(var(--border-default))] px-6 py-10">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold tracking-tight">Wiki</h1>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg-secondary))]">
            Synthesized knowledge. Agent writes, you review, status moves
            through draft → reviewed → stable.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
            <span>
              <span className="text-[hsl(var(--fg-secondary))]">{allFiles.length}</span> total
            </span>
            <span>
              <span className="text-[hsl(var(--status-warn))]">{drafts}</span> draft
            </span>
            <span>
              <span className="text-[hsl(var(--status-ok))]">{reviewed}</span> reviewed
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <div className="px-5 pt-4 pb-2">
                <span className="label-uppercase">Tree</span>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-2 pb-3">
                <WikiTree root={root} />
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <div className="px-5 pt-4 pb-2">
                <span className="label-uppercase">Recently updated</span>
              </div>
              <div className="px-5 pb-5">
                {recent.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="label-uppercase mb-2">Vault is empty</div>
                    <p className="text-sm text-[hsl(var(--fg-secondary))] max-w-sm mx-auto">
                      Drop markdown files into the wiki folder, or run a skill —
                      skills write here.
                    </p>
                  </div>
                ) : (
                  <ul className="dense space-y-1">
                    {recent.map((f) => (
                      <li key={f.path}>
                        <Link
                          href={`/wiki/${f.path.replace(/^wiki\//, "").replace(/\.md$/, "")}`}
                          className="group flex items-center justify-between gap-3 rounded px-2 py-1.5 transition-colors hover:bg-[hsl(var(--bg-elevated))]"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-[hsl(var(--fg-dim))] opacity-50 group-hover:opacity-100">·</span>
                            <span className="truncate text-sm text-[hsl(var(--fg-primary))]">
                              {f.title}
                            </span>
                            {f.status && (
                              <span
                                className={`inline-flex h-4 items-center rounded px-1.5 font-mono text-[9px] uppercase tracking-wider ${
                                  f.status === "draft"
                                    ? "bg-[hsl(var(--status-warn-dim))] text-[hsl(var(--status-warn))]"
                                    : f.status === "reviewed"
                                      ? "bg-[hsl(var(--status-ok-dim))] text-[hsl(var(--status-ok))]"
                                      : "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--fg-dim))]"
                                }`}
                              >
                                {f.status}
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))] shrink-0">
                            {relativeDate(f.updated)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
