import { StandupTile, type StandupBrief } from "@/components/home/standup-tile";
import { ActivityFeed, type ActivityItem } from "@/components/home/activity-feed";
import { SkillQuickLaunch } from "@/components/home/skill-quick-launch";
import { HermesStatusTile } from "@/components/home/hermes-status";
import { listFiles } from "@/lib/vault";
import { hermes } from "@/lib/hermes";
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
    const body = parsed.content;
    const sections = parseStandupSections(body);
    return {
      date: today,
      ...sections,
      source: "fresh",
    };
  } catch {
    return null;
  }
}

function parseStandupSections(body: string): {
  done: string[];
  doing: string[];
  blocked: string[];
  watch: string[];
} {
  const out = { done: [] as string[], doing: [] as string[], blocked: [] as string[], watch: [] as string[] };
  let cur: keyof typeof out | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^##+\s+(done|doing|blocked|watch)\b/i);
    if (heading) {
      cur = heading[1].toLowerCase() as keyof typeof out;
      continue;
    }
    if (cur && line.startsWith("- ")) {
      out[cur].push(line.slice(2));
    }
  }
  return out;
}

function loadActivity(): ActivityItem[] {
  const items: ActivityItem[] = [];
  try {
    for (const f of listFiles()) {
      if (f.zone === "wiki" && f.status === "draft") {
        items.push({
          kind: "wiki-draft",
          title: f.title,
          path: f.path,
          date: f.updated,
        });
      }
      if (f.zone === "journal") {
        items.push({ kind: "journal", title: f.title, path: f.path, date: f.created });
      }
      if (f.zone === "sources" && f.status === "unread") {
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
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 12);
}

export default async function HomePage() {
  const [brief, activity, status, sessions, crons] = await Promise.all([
    loadStandup(),
    Promise.resolve(loadActivity()),
    hermes().status(),
    hermes().listSessions(5),
    hermes().listCrons(),
  ]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">
          What's running, what's drafted, what's open.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-2">
          <StandupTile brief={brief} />
        </div>
        <SkillQuickLaunch />
        <div className="md:col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <HermesStatusTile status={status} sessions={sessions} crons={crons} />
      </div>
    </div>
  );
}
