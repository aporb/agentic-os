import { NextResponse } from "next/server";
import { getProfileDeepDive } from "@/lib/insights";

/**
 * GET /api/insights/profile/{id}
 *
 * Returns deep dive for a specific profile.
 * No auth required — read-only data behind Tailscale network.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = getProfileDeepDive(id);
    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/insights/profile]", err);
    return NextResponse.json(
      { error: "Failed to load profile deep dive", detail: String(err) },
      { status: 500 }
    );
  }
}
