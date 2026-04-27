/**
 * Ephemeral session-token auth for the Agentic OS Console.
 *
 * The token is generated at server start and written to:
 *   ~/.hermes/agentic-os/token
 *
 * The browser receives the token via the launch URL Hermes opens
 * (?t=<token>). All API routes require Authorization: Bearer <token>
 * or ?t=<token> on the request.
 *
 * No accounts. No password reset. Single-user, localhost-bound.
 *
 * Spec: §7 Auth Model.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

const TOKEN_PATH =
  process.env.AGENTIC_OS_TOKEN_PATH ??
  join(homedir(), ".hermes", "agentic-os", "token");

let cachedToken: string | null = null;

/**
 * Read or generate the session token.
 * Hermes install.sh generates it before starting the server, but we
 * regenerate if missing (e.g. fresh dev start).
 */
export function getOrCreateToken(): string {
  if (cachedToken) return cachedToken;
  if (existsSync(TOKEN_PATH)) {
    cachedToken = readFileSync(TOKEN_PATH, "utf8").trim();
    if (cachedToken.length >= 32) return cachedToken;
  }
  const token = randomBytes(32).toString("hex");
  mkdirSync(dirname(TOKEN_PATH), { recursive: true });
  writeFileSync(TOKEN_PATH, token, { mode: 0o600 });
  cachedToken = token;
  return token;
}

/**
 * Validate a request's token.
 * Looks at:
 *   1. Authorization: Bearer <token>
 *   2. ?t=<token> query param (for the initial browser launch)
 *   3. Cookie agentic_os_token (set after first valid request)
 */
export function validateToken(req: NextRequest): boolean {
  const expected = getOrCreateToken();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() === expected;
  }

  const t = req.nextUrl.searchParams.get("t");
  if (t && t === expected) return true;

  const cookie = req.cookies.get("agentic_os_token")?.value;
  if (cookie && cookie === expected) return true;

  return false;
}
