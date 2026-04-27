import { NextRequest, NextResponse } from "next/server";
import { listSkills } from "@/lib/skills";
import { validateToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const pack = req.nextUrl.searchParams.get("pack");
  const skills = listSkills(pack as never);
  // Strip the body to keep payload small; UI fetches body on the detail page.
  return NextResponse.json(
    skills.map((s) => ({ id: s.id, pack: s.pack, source: s.source, fm: s.fm })),
  );
}
