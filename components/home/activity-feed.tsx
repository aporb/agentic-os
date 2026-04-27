import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export type ActivityItem = {
  kind: "wiki-draft" | "wiki-reviewed" | "journal" | "source-unread" | "contradiction";
  title: string;
  path: string;
  date?: string;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Vault activity</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Empty vault. Drop something in <Link className="underline" href="/sources">Sources</Link>{" "}
            or run a skill to populate it.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <Link
                  href={
                    it.path.startsWith("wiki/") || it.path.startsWith("journal/")
                      ? `/${it.path.replace(/\.md$/, "").replace(/^wiki\//, "wiki/")}`
                      : `/${it.path.replace(/\.md$/, "")}`
                  }
                  className="flex-1 truncate hover:underline"
                >
                  {it.title}
                </Link>
                <KindBadge kind={it.kind} />
                {it.date && <span className="text-xs text-muted-foreground">{it.date}</span>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function KindBadge({ kind }: { kind: ActivityItem["kind"] }) {
  const map: Record<ActivityItem["kind"], { label: string; variant: "default" | "secondary" | "muted" | "destructive" }> = {
    "wiki-draft": { label: "draft", variant: "secondary" },
    "wiki-reviewed": { label: "reviewed", variant: "default" },
    journal: { label: "journal", variant: "muted" },
    "source-unread": { label: "unread", variant: "muted" },
    contradiction: { label: "conflict", variant: "destructive" },
  };
  const { label, variant } = map[kind];
  return (
    <Badge variant={variant} className="text-[10px]">
      {label}
    </Badge>
  );
}
