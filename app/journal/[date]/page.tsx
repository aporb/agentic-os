import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { readFile } from "@/lib/vault";
import { MarkdownView } from "@/components/wiki/markdown-view";

export const dynamic = "force-dynamic";

export default async function JournalEntryPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  let file;
  try {
    file = readFile(`journal/${date}.md`);
  } catch {
    notFound();
  }
  if (!file) notFound();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/journal"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Journal
      </Link>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{file.title}</h1>
      <MarkdownView body={file.body} />
    </div>
  );
}
