import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillCard } from "@/components/skills/skill-card";
import { getPack, type PackId } from "@/lib/packs";
import { listSkills } from "@/lib/skills";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PackPage({ params }: { params: Promise<{ pack: string }> }) {
  const { pack: packParam } = await params;
  const pack = getPack(packParam);
  if (!pack || !pack.v1) notFound();

  const skills = listSkills(pack.id as PackId);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/skills"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All packs
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="mr-2">{pack.emoji}</span>
          {pack.label} Pack
        </h1>
        <p className="text-sm text-muted-foreground">{pack.subtitle} — {pack.description}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}
