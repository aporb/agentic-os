import { NextResponse } from "next/server";
import { hermes, readGatewayStateFromDisk } from "@/lib/hermes";

/**
 * Lightweight unauthenticated status probe used by the nav badge.
 * Returns { running, model } from Hermes' /health/detailed when available,
 * falls back to reading ~/.hermes/gateway_state.json directly.
 */
export async function GET() {
  const status = await hermes().status();
  if (status.running !== false || (status.platforms && Object.keys(status.platforms).length > 0)) {
    return NextResponse.json({
      running: status.running,
      model: status.platforms ? Object.keys(status.platforms)[0] : null,
    });
  }
  const disk = readGatewayStateFromDisk();
  return NextResponse.json({
    running: disk.running,
    model: disk.platforms ? Object.keys(disk.platforms)[0] : null,
  });
}
