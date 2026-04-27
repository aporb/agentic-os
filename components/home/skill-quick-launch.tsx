import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const PINNED = [
  { id: "ceo/weekly-review", label: "Weekly review", pack: "CEO" },
  { id: "ceo/competitor-research", label: "Competitor research", pack: "CEO" },
  { id: "cmo/blog-post", label: "Draft blog post", pack: "Marketing" },
  { id: "cro/cold-outreach-email", label: "Cold email", pack: "Revenue" },
];

export function SkillQuickLaunch() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quick launch</CardTitle>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PINNED.map((s) => (
            <li key={s.id}>
              <Link
                href={{ pathname: `/skills/${s.id.split("/")[0]}/${s.id.split("/")[1]}` }}
                className="flex flex-col rounded-md border border-border bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary"
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.pack}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
