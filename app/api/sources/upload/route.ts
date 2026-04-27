import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { validateToken } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { writeFile as writeVaultFile } from "@/lib/vault";

const ALLOWED_EXT = new Set([".pdf", ".md", ".txt", ".html", ".json"]);

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: `disallowed extension: ${ext}` }, { status: 400 });
  }

  const cfg = getConfig();
  const slug = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  const today = new Date().toISOString().slice(0, 10);

  if (ext === ".md" || ext === ".txt" || ext === ".html") {
    // text-mode: write into sources/ directly with frontmatter
    const text = await file.text();
    const path = `sources/${slug.replace(/\.[^.]+$/, "")}.md`;
    writeVaultFile(
      path,
      text,
      {
        type: "source",
        title: file.name,
        created: today,
        source_url: "",
        author: "",
        status: "unread",
        tags: [],
      },
      { force: true },
    );
    return NextResponse.json({ path });
  }

  // binary mode: store the file alongside a markdown stub that points at it
  const sourcesDir = join(cfg.vault_path, "sources", "binary");
  if (!existsSync(sourcesDir)) mkdirSync(sourcesDir, { recursive: true });
  const binPath = join(sourcesDir, slug);
  const buf = Buffer.from(await file.arrayBuffer());
  writeFileSync(binPath, buf);

  const stubPath = `sources/${slug.replace(/\.[^.]+$/, "")}.md`;
  writeVaultFile(
    stubPath,
    `Binary source. Original at \`sources/binary/${slug}\` (${buf.length} bytes).`,
    {
      type: "source",
      title: file.name,
      created: today,
      source_url: `sources/binary/${slug}`,
      author: "",
      status: "unread",
      tags: [ext.replace(".", "")],
    },
    { force: true },
  );

  return NextResponse.json({ path: stubPath });
}
