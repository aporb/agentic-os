import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PackGlyph } from "@/components/skills/pack-glyph";
import type { Pack } from "@/lib/packs";
import type { Skill } from "@/lib/skills";

export function PackCard({
  pack,
  skills,
}: {
  pack: Pack;
  skills: Skill[];
}) {
  const previewNames = skills.slice(0, 2).map((s) => s.fm.name);
  const remaining = Math.max(0, skills.length - 2);

  const inner = (
    <Card className="group h-full transition-colors hover:border-[hsl(var(--border-strong))]">
      <div className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--accent-dim))] text-[hsl(var(--accent-base))]">
          <PackGlyph pack={pack.id} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[hsl(var(--fg-primary))]">
              {pack.label} Pack
            </h3>
            {!pack.v1 && (
              <span className="inline-flex h-4 items-center rounded bg-[hsl(var(--status-info-dim))] px-1.5 font-mono text-[9px] font-medium text-[hsl(var(--status-info))] tracking-wider uppercase">
                Coming
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[hsl(var(--fg-dim))]">{pack.subtitle}</p>
        </div>
      </div>
      <div className="border-t border-[hsl(var(--border-subtle))] px-5 py-3 dense">
        <p className="text-xs leading-relaxed text-[hsl(var(--fg-secondary))] line-clamp-2 mb-2">
          {pack.description}
        </p>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
          {skills.length > 0 ? (
            <>
              <span className="text-[hsl(var(--fg-secondary))]">{skills.length} skills</span>
              <span className="text-[hsl(var(--fg-dim))]">·</span>
              <span className="truncate">
                {previewNames.join(" · ")}
                {remaining > 0 && (
                  <span className="text-[hsl(var(--fg-dim))]"> · +{remaining}</span>
                )}
              </span>
            </>
          ) : (
            <span>v2 — arriving in this build</span>
          )}
        </div>
      </div>
    </Card>
  );

  if (!pack.v1 && skills.length === 0) return inner;
  return (
    <Link href={`/skills/${pack.id}`} className="block">
      {inner}
    </Link>
  );
}
