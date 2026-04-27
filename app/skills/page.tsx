import { PackCard } from "@/components/skills/pack-card";
import { PACKS } from "@/lib/packs";
import { listSkills } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default function SkillsIndexPage() {
  const counts = new Map<string, number>();
  for (const pack of PACKS) {
    if (!pack.v1) {
      counts.set(pack.id, 0);
      continue;
    }
    counts.set(pack.id, listSkills(pack.id).length);
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your AI C-suite</h1>
        <p className="text-sm text-muted-foreground">
          Each pack is a set of plain-English skills your agent runs on demand or on a schedule.
          Edit any skill in your vault to customize it; your version always wins over the shipped one.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PACKS.map((pack) => (
          <PackCard key={pack.id} pack={pack} skillCount={counts.get(pack.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
