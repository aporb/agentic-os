import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "@/lib/vault";
import { validateToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { path } = await ctx.params;
  try {
    const file = readFile(path.join("/"));
    return NextResponse.json(file);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { path: parts } = await ctx.params;
  const path = parts.join("/");
  const body = (await req.json()) as { frontmatter?: Record<string, unknown>; body?: string };
  try {
    const existing = readFile(path);
    const newFm = { ...existing.frontmatter, ...(body.frontmatter ?? {}) };
    writeFile(path, body.body ?? existing.body, newFm);
    return NextResponse.json({ ok: true, path });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { path: parts } = await ctx.params;
  const path = parts.join("/");
  const body = (await req.json()) as { frontmatter: Record<string, unknown>; body: string };
  try {
    writeFile(path, body.body, body.frontmatter);
    return NextResponse.json({ ok: true, path });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
