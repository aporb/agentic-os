import { NextResponse } from "next/server";
import { getInsights } from "@/lib/insights";

/**
 * GET /api/insights
 *
 * Returns live multi-profile dashboard data.
 * Reads state.db from all Hermes profiles on this machine.
 * No auth required (local-only, behind Tailscale funnel).
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
