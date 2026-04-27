import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/auth";
import { writeFile as writeVaultFile } from "@/lib/vault";

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { url } = (await req.json()) as { url: string };
  if (!url?.startsWith("http")) {
    return NextResponse.json({ error: "url must start with http(s)://" }, { status: 400 });
  }

  // Naive HTML fetch — for production we'd want jsdom + readability. v1 keeps it minimal.
  let text = "";
  let title = url;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "agentic-os-console/0.1" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `fetch failed: ${res.status}` },
        { status: 400 },
      );
    }
    const html = await res.text();
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (m) title = m[1].trim();
    text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50_000);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
  const path = `sources/${today}-${slug || "untitled"}.md`;

  writeVaultFile(
    path,
    text,
    {
      type: "source",
      title,
      created: today,
      source_url: url,
      author: "",
      status: "unread",
      tags: ["web"],
    },
    { force: true },
  );

  return NextResponse.json({ path });
}
