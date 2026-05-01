import { NextResponse } from "next/server";
import { getInsights } from "@/lib/insights";

/**
 * GET /api/insights
 *
 * Returns live multi-profile dashboard data with deep intelligence.
 * No auth required — read-only data behind Tailscale network.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getInsights();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/insights]", err);
    return NextResponse.json(
      { error: "Failed to load insights", detail: String(err) },
      { status: 500 }
    );
  }
}
