import { NextResponse } from "next/server";
import { getInsights, generateHTMLReport } from "@/lib/insights";

/**
 * GET /api/insights/export
 *
 * Returns a standalone HTML report string.
 * No auth required — read-only data behind Tailscale network.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getInsights();
    const html = generateHTMLReport(data);
    return NextResponse.json({ html, generatedAt: data.timestamp });
  } catch (err) {
    console.error("[api/insights/export]", err);
    return NextResponse.json(
      { error: "Failed to export", detail: String(err) },
      { status: 500 }
    );
  }
}
