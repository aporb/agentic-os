import Link from "next/link";
import { Card } from "@/components/ui/card";

const PINNED = [
  { id: "ceo/weekly-review", label: "Weekly review", pack: "CEO", kbd: "1" },
  { id: "ceo/competitor-research", label: "Competitor research", pack: "CEO", kbd: "2" },
  { id: "cmo/blog-post", label: "Draft blog post", pack: "Marketing", kbd: "3" },
  { id: "cro/cold-outreach-email", label: "Cold email", pack: "Revenue", kbd: "4" },
];

export function SkillQuickLaunch() {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="label-uppercase">Quick launch</span>
        <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">⌘ + #</span>
      </div>
      <ul className="px-2 pb-3 dense">
        {PINNED.map((s) => (
          <li key={s.id}>
            <Link
              href={`/skills/${s.id.split("/")[0]}/${s.id.split("/")[1]}`}
              className="flex items-center justify-between gap-3 rounded px-3 py-2 transition-colors hover:bg-[hsl(var(--bg-elevated))]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[hsl(var(--border-default))] px-1 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
                  ⌘{s.kbd}
                </span>
                <span className="text-sm text-[hsl(var(--fg-primary))] truncate">{s.label}</span>
              </div>
              <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))] shrink-0">
                {s.pack}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
