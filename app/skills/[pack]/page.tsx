import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SkillCard } from "@/components/skills/skill-card";
import { PackGlyph } from "@/components/skills/pack-glyph";
import { getPack, type PackId } from "@/lib/packs";
import { listSkills } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default async function PackPage({ params }: { params: Promise<{ pack: string }> }) {
  const { pack: packParam } = await params;
  const pack = getPack(packParam);
  if (!pack || !pack.v1) notFound();

  const skills = listSkills(pack.id as PackId);

  return (
    <div className="flex flex-col">
      <section className="hero-glow border-b border-[hsl(var(--border-default))] px-6 py-10">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/skills"
            className="inline-flex items-center gap-1 text-xs text-[hsl(var(--fg-dim))] hover:text-[hsl(var(--fg-secondary))] transition-colors mb-4 dense"
          >
            <ChevronLeft className="h-3 w-3" />
            All packs
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--accent-dim))] text-[hsl(var(--accent-base))]">
              <PackGlyph pack={pack.id} className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {pack.label} Pack
              </h1>
              <p className="text-xs text-[hsl(var(--fg-dim))] uppercase tracking-wider mt-0.5">
                {pack.subtitle}
              </p>
              <p className="mt-3 max-w-2xl text-sm text-[hsl(var(--fg-secondary))]">
                {pack.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((s) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
