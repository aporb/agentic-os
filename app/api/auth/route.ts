import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/auth";

/**
 * Token validation. The browser hits this once at app load with ?t=<token>
 * and gets a Set-Cookie back so subsequent requests don't need the URL param.
 */
export async function GET(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const t = req.nextUrl.searchParams.get("t");
  const res = NextResponse.json({ ok: true });
  if (t) {
    res.cookies.set("agentic_os_token", t, {
      httpOnly: true,
      secure: false, // localhost
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }
  return res;
}
