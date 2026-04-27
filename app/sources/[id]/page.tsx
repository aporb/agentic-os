import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { readFile } from "@/lib/vault";
import { MarkdownView } from "@/components/wiki/markdown-view";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SourceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidates = [
    `sources/${id}`,
    `sources/${id}.md`,
  ];
  let file;
  for (const c of candidates) {
    try {
      file = readFile(c);
      break;
    } catch {}
  }
  if (!file) notFound();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/sources"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Sources
      </Link>
      <header className="mb-4">
        {file.status && (
          <Badge variant="secondary" className="mb-1">
            {file.status}
          </Badge>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{file.title}</h1>
        <p className="text-xs text-muted-foreground">{file.path}</p>
      </header>
      <MarkdownView body={file.body} />
    </div>
  );
}
