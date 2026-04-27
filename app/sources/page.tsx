import { listFiles } from "@/lib/vault";
import { IngestZone } from "@/components/sources/ingest-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateToken } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES = ["unread", "reading", "processed"] as const;

export default function SourcesPage() {
  const all = listFiles("sources");
  const grouped = {
    unread: all.filter((f) => !f.status || f.status === "unread"),
    reading: all.filter((f) => f.status === "reading"),
    processed: all.filter((f) => f.status === "processed"),
  };
  const token = getOrCreateToken();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">
          Drop the raw materials your AI C-suite reads from. Sources are read-only;
          the agent synthesizes them into wiki pages you can review.
        </p>
      </header>

      <div className="mb-6">
        <IngestZone token={token} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium capitalize">
                {s}
                <Badge variant="muted" className="text-[10px]">
                  {grouped[s].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {grouped[s].length === 0 && (
                  <li className="text-sm text-muted-foreground">No items.</li>
                )}
                {grouped[s].map((f) => (
                  <li key={f.path} className="flex items-start justify-between gap-2">
                    <Link
                      href={`/wiki/${f.path.replace(/\.md$/, "")}`}
                      className="flex-1 truncate text-sm hover:underline"
                    >
                      {f.title}
                    </Link>
                    {f.created && (
                      <span className="text-xs text-muted-foreground">{f.created}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
