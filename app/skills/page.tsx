import { PackCard } from "@/components/skills/pack-card";
import { PACKS } from "@/lib/packs";
import { listSkills } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default function SkillsIndexPage() {
  const skillsByPack = new Map(
    PACKS.map((p) => [p.id, listSkills(p.id)] as const),
  );

  const totalSkills = Array.from(skillsByPack.values()).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div className="flex flex-col">
      <section className="hero-glow border-b border-[hsl(var(--border-default))] px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your AI C-suite
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg-secondary))]">
            Each pack is a set of plain-English skills your agent runs on
            demand or on a schedule. Edit any skill in your vault to customize
            it; your version always wins.
          </p>
          <p className="mt-4 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
            {totalSkills} skills · {PACKS.filter((p) => p.v1).length} active packs
          </p>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PACKS.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                skills={skillsByPack.get(pack.id) ?? []}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
