import { StandupTile, type StandupBrief } from "@/components/home/standup-tile";
import { ActivityFeed, type ActivityItem } from "@/components/home/activity-feed";
import { SkillQuickLaunch } from "@/components/home/skill-quick-launch";
import { HermesStatusTile } from "@/components/home/hermes-status";
import { VaultSparkline, type VaultSparklinePoint } from "@/components/home/vault-sparkline";
import { listFiles } from "@/lib/vault";
import { hermes, readSessionsFromDisk, readJobsFromDisk } from "@/lib/hermes";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

async function loadStandup(): Promise<StandupBrief | null> {
  const cfg = getConfig();
  const today = new Date().toISOString().slice(0, 10);
  const candidate = join(cfg.vault_path, "journal", `${today}-standup.md`);
  if (!existsSync(candidate)) return null;
  try {
    const parsed = matter(readFileSync(candidate, "utf8"));
    const sections = parseStandupSections(parsed.content);
    return { date: today, ...sections, source: "fresh" };
  } catch {
    return null;
  }
}

function parseStandupSections(body: string) {
  const out = { done: [] as string[], doing: [] as string[], blocked: [] as string[], watch: [] as string[] };
  let cur: keyof typeof out | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^##+\s+(done|doing|blocked|watch)\b/i);
    if (heading) { cur = heading[1].toLowerCase() as keyof typeof out; continue; }
    if (cur && line.startsWith("- ")) out[cur].push(line.slice(2));
  }
  return out;
}

function loadActivity(): ActivityItem[] {
  const items: ActivityItem[] = [];
  try {
    for (const f of listFiles()) {
      if (f.zone === "wiki" && f.status === "draft") {
        items.push({ kind: "wiki-draft", title: f.title, path: f.path, date: f.updated });
      }
      if (f.zone === "wiki" && f.status === "reviewed") {
        items.push({ kind: "wiki-reviewed", title: f.title, path: f.path, date: f.updated });
      }
      if (f.zone === "journal") {
        items.push({ kind: "journal", title: f.title, path: f.path, date: f.created });
      }
      if (f.zone === "sources" && (f.status === "unread" || !f.status)) {
        items.push({ kind: "source-unread", title: f.title, path: f.path });
      }
      if (f.path === "wiki/contradictions.md" && f.body.length > 200) {
        items.push({ kind: "contradiction", title: "Contradictions log", path: f.path });
      }
    }
  } catch (err) {
    console.warn("[home] activity load failed:", err);
  }
  return items
    .filter((it) => {
      // hide template scaffolds: YYYY-MM-DD as title or date, or _-prefixed paths
      if (/^YYYY-MM-DD/.test(it.title) || /^_/.test(it.path.split("/").pop() ?? "")) return false;
      if (it.date && /^YYYY/.test(it.date)) return false;
      return true;
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 12);
}

function loadVaultSparkline(): { points: VaultSparklinePoint[]; total: number } {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }
  let total = 0;
  try {
    for (const f of listFiles()) {
      if (!f.updated) { total++; continue; }
      total++;
      if (buckets.has(f.updated)) buckets.set(f.updated, (buckets.get(f.updated) ?? 0) + 1);
    }
  } catch {
    /* ignore */
  }
  return {
    points: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
    total,
  };
}

export default async function HomePage() {
  const [brief, activity, status, sessions, jobs] = await Promise.all([
    loadStandup(),
    Promise.resolve(loadActivity()),
    hermes().status(),
    readSessionsFromDisk(5),
    hermes().listJobs().then((j) => (j.length > 0 ? j : readJobsFromDisk())),
  ]);
  const sparkline = loadVaultSparkline();
  const today = new Date();

  return (
    <div className="flex flex-col">
      {/* Hero zone */}
      <section className="hero-glow border-b border-[hsl(var(--border-default))] px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--fg-dim))] font-mono">
            {jobs.length > 0
              ? `${jobs.filter((j) => j.enabled).length} active automations · ${activity.length} vault items moved`
              : "No automations scheduled yet"}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 py-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-2">
              <StandupTile brief={brief} />
            </div>
            <SkillQuickLaunch />
            <div className="md:col-span-2">
              <ActivityFeed items={activity} />
            </div>
            <HermesStatusTile status={status} sessions={sessions} jobs={jobs} />
            <div className="md:col-span-2 xl:col-span-3">
              <VaultSparkline data={sparkline.points} totalFiles={sparkline.total} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
