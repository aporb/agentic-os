import { NextRequest } from "next/server";
import { hermes } from "@/lib/hermes";
import { validateToken } from "@/lib/auth";

/**
 * Stream skill-execution events as newline-delimited JSON.
 *
 * The Console proxies through to Hermes' /v1/skills/run; this endpoint exists
 * so the browser only ever talks to the Console (one origin, one auth token)
 * and never has to discover/authenticate against Hermes directly.
 */
export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const payload = (await req.json()) as {
    skill_id: string;
    inputs: Record<string, string>;
    delivery?: "stream" | "wiki" | "telegram";
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const evt of hermes().runSkill(payload)) {
          controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", message: (err as Error).message }) + "\n",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}
