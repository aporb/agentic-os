import { NextRequest, NextResponse } from "next/server";
import { webSearch } from "@/lib/search";
import { validateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { query, num } = (await req.json()) as { query: string; num?: number };
  if (!query?.trim()) return NextResponse.json({ error: "missing query" }, { status: 400 });
  const results = await webSearch(query, { numResults: num ?? 10 });
  return NextResponse.json({ results });
}
