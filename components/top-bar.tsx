"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  "": "Today",
  skills: "Skills",
  ceo: "CEO Pack",
  cro: "Revenue Pack",
  cmo: "Marketing Pack",
  cpo: "Product Pack",
  cto: "Engineering Pack",
  caio: "AI Ops Pack",
  cfo: "Finance Pack",
  wiki: "Wiki",
  journal: "Journal",
  sources: "Sources",
  automations: "Automations",
  settings: "Settings",
};

function humanize(seg: string): string {
  if (SEGMENT_LABELS[seg] !== undefined) return SEGMENT_LABELS[seg];
  if (seg.startsWith("[")) return seg;
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopBar() {
  const path = usePathname();
  const segments = path.split("/").filter(Boolean);
  const trail = segments.length === 0 ? ["Today"] : segments.map(humanize);

  return (
    <div className="hidden md:flex h-12 items-center justify-between border-b border-[hsl(var(--border-default))] px-6 dense">
      <div className="flex items-center gap-1.5 text-xs">
        <Link href="/" className="text-[hsl(var(--fg-dim))] hover:text-[hsl(var(--fg-secondary))] transition-colors">
          Console
        </Link>
        {trail.map((label, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-[hsl(var(--fg-dim))]" />
            <span
              className={
                i === trail.length - 1
                  ? "text-[hsl(var(--fg-primary))] font-medium"
                  : "text-[hsl(var(--fg-dim))]"
              }
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
        <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}
