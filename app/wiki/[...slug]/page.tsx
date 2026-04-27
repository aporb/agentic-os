import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { readFile } from "@/lib/vault";
import { MarkdownView } from "@/components/wiki/markdown-view";
import { FrontmatterEditor } from "@/components/wiki/frontmatter-editor";
import { Badge } from "@/components/ui/badge";
import { getOrCreateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  // Caller may have given the slug as "competitor-acme" (assume wiki/) or "wiki/competitor-acme"
  const candidates = [
    slug.endsWith(".md") ? slug : `${slug}.md`,
    slug.startsWith("wiki/") ? slug : `wiki/${slug}.md`,
  ];

  let file;
  for (const c of candidates) {
    try {
      file = readFile(c);
      break;
    } catch {
      // try next
    }
  }
  if (!file) notFound();

  const token = getOrCreateToken();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/wiki"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Wiki
      </Link>

      <header className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          {file.status && (
            <Badge variant={file.status === "stable" ? "default" : "secondary"}>
              {file.status}
            </Badge>
          )}
          {(file.tags ?? []).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{file.title}</h1>
        <p className="text-xs text-muted-foreground">
          {file.path} {file.updated && `· updated ${file.updated}`}
        </p>
      </header>

      {file.zone === "wiki" && (
        <div className="mb-4">
          <FrontmatterEditor
            path={file.path}
            initialStatus={file.status as "draft" | "reviewed" | "stable" | undefined}
            initialTags={file.tags}
            token={token}
          />
        </div>
      )}

      <MarkdownView body={file.body} />
    </div>
  );
}
