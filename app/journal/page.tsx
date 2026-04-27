import Link from "next/link";
import { listFiles } from "@/lib/vault";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function JournalPage() {
  const entries = listFiles("journal").sort((a, b) =>
    (b.created ?? b.path).localeCompare(a.created ?? a.path),
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Daily notes, meeting prep, and reflections. You own this zone — agent reads only.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No journal entries yet.</p>
          ) : (
            <ul className="space-y-1">
              {entries.map((f) => (
                <li key={f.path} className="flex items-center justify-between">
                  <Link
                    href={`/wiki/${f.path.replace(/\.md$/, "")}`}
                    className="hover:underline"
                  >
                    {f.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">{f.created}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
