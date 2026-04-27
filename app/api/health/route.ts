import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "agentic-os-console",
    version: process.env.npm_package_version ?? "0.1.0",
    vault: getConfig().vault_path,
  });
}
