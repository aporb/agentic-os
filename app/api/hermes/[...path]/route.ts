import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/auth";
import { getConfig } from "@/lib/config";

/**
 * Generic proxy to Hermes' api_server gateway platform.
 * Used for endpoints we don't have first-class wrappers for (yet).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

async function proxy(req: NextRequest, pathParts: string[]) {
  if (!validateToken(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cfg = getConfig();
  const upstream = `${cfg.hermes_api_url.replace(/\/$/, "")}/${pathParts.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers.entries()) {
    if (["host", "authorization", "cookie"].includes(k.toLowerCase())) continue;
    headers[k] = v;
  }
  if (cfg.hermes_token) headers["authorization"] = `Bearer ${cfg.hermes_token}`;

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(upstream, init);
  // Stream response back transparently.
  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
