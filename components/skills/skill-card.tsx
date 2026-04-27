import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Skill } from "@/lib/skills";

export function SkillCard({ skill }: { skill: Skill }) {
  const isCron = skill.fm.frequency?.startsWith("cron:");
  return (
    <Link
      href={`/skills/${skill.pack}/${skill.fm.name}`}
      className="group block"
    >
      <Card className="h-full p-4 transition-colors hover:border-[hsl(var(--border-strong))]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-sm font-medium text-[hsl(var(--fg-primary))] truncate">
            {skill.fm.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {skill.source === "vault" && (
              <span className="inline-flex h-4 items-center rounded bg-[hsl(var(--accent-dim))] px-1.5 font-mono text-[9px] font-medium text-[hsl(var(--accent-base))] uppercase tracking-wider">
                yours
              </span>
            )}
            {isCron && (
              <span className="inline-flex h-4 items-center rounded border border-[hsl(var(--border-default))] px-1.5 font-mono text-[9px] text-[hsl(var(--fg-dim))] uppercase tracking-wider">
                cron
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[hsl(var(--fg-secondary))]">
          {skill.fm.description}
        </p>
      </Card>
    </Link>
  );
}
