import { tree, listFiles } from "@/lib/vault";
import { WikiTree } from "@/components/wiki/tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function WikiIndex() {
  const root = tree();
  const recent = listFiles("wiki")
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""))
    .slice(0, 8);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Wiki</h1>
        <p className="text-sm text-muted-foreground">
          Synthesized knowledge. Agent writes, you review, status moves draft → reviewed → stable.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vault tree</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto">
            <WikiTree root={root} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recently updated</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recent.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No wiki pages yet. Run a skill or run <code>/ingest</code> to populate the wiki.
                </li>
              )}
              {recent.map((f) => (
                <li key={f.path} className="flex items-start justify-between gap-3">
                  <Link
                    href={`/wiki/${f.path.replace(/^wiki\//, "").replace(/\.md$/, "")}`}
                    className="flex-1 truncate hover:underline"
                  >
                    {f.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">{f.updated}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
