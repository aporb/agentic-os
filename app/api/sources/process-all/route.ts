import { NextRequest, NextResponse } from "next/server";
import { hermes } from "@/lib/hermes";
import { listFiles } from "@/lib/vault";
import { validateToken } from "@/lib/auth";

/**
 * Fire a Hermes run that ingests every unread source into a wiki page.
 *
 * Returns immediately with the run_id and count. The agent works in the
 * background; the user sees status updates by refreshing /sources or
 * watching /api/hermes/v1/runs/{run_id}/events from the UI.
 */
export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const unread = listFiles("sources").filter(
    (f) => !f.status || f.status === "unread",
  );

  if (unread.length === 0) {
    return NextResponse.json({ count: 0, message: "No unread sources" });
  }

  const sourceList = unread
    .map((f) => `- ${f.path}${f.title && f.title !== f.path ? ` (${f.title})` : ""}`)
    .join("\n");

  const prompt = `Process these ${unread.length} unread vault sources into wiki pages.

For each source listed below, do these steps in order:

1. Read the source file (at the path shown). It is a markdown file with frontmatter.
2. Synthesize the content into a new wiki page at \`wiki/<source-slug>.md\`, where \`<source-slug>\` is the source filename without the \`sources/\` prefix and without \`.md\`.
3. The new wiki page must have this frontmatter shape:
   \`\`\`yaml
   type: wiki
   title: "<descriptive title from the source>"
   created: ${new Date().toISOString().slice(0, 10)}
   updated: ${new Date().toISOString().slice(0, 10)}
   sources: ["<source-filename-without-extension>"]
   status: draft
   tags: []
   \`\`\`
4. The body should clearly synthesize the source's key points, claims, and conclusions. Cite specifics with \`[[<source-filename>]]\` wikilinks. Use practitioner voice: short declarative sentences, no em-dash abuse, no hedging language, no productivity framing. Write the way a practitioner would summarize for their own reference.
5. After saving the wiki page, update the source file's frontmatter \`status\` from \`unread\` to \`processed\`. Leave everything else in the source untouched.
6. Move on to the next source. If a source can't be processed (read error, malformed frontmatter, unsupported binary type), log the failure and continue with the rest.

When all sources are done, output a brief summary: how many succeeded, how many failed, and the wiki paths created.

Sources to process:
${sourceList}`;

  try {
    const { run_id } = await hermes().startRun({ input: prompt });
    return NextResponse.json({ run_id, count: unread.length });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
