import { NextRequest, NextResponse } from "next/server";
import { hermes } from "@/lib/hermes";
import { readFile } from "@/lib/vault";
import { validateToken } from "@/lib/auth";

/**
 * Fire a Hermes run for a single source file. Used by per-row Process buttons.
 */
export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = (await req.json()) as { path: string };
  if (!path?.startsWith("sources/")) {
    return NextResponse.json(
      { error: "path must start with sources/" },
      { status: 400 },
    );
  }

  // Validate the source exists and is readable before firing the run
  try {
    readFile(path);
  } catch {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const slug = path.replace(/^sources\//, "").replace(/\.md$/, "");

  const prompt = `Process this single unread vault source into a wiki page.

Steps:

1. Read the source file at \`${path}\`.
2. Synthesize the content into a new wiki page at \`wiki/${slug}.md\` with this frontmatter:
   \`\`\`yaml
   type: wiki
   title: "<descriptive title from the source>"
   created: ${today}
   updated: ${today}
   sources: ["${slug}"]
   status: draft
   tags: []
   \`\`\`
3. The body should clearly synthesize key points, claims, and conclusions. Cite specifics with \`[[${slug}]]\` wikilinks. Use practitioner voice: short declarative sentences, no em-dash abuse, no hedging language, no productivity framing.
4. Update the source's frontmatter \`status\` from \`unread\` (or empty) to \`processed\`. Leave everything else in the source untouched.

When done, output a one-line summary: the wiki path created and any caveats.`;

  try {
    const { run_id } = await hermes().startRun({ input: prompt });
    return NextResponse.json({ run_id, path });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
