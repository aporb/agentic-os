import { NextRequest } from "next/server";
import { hermes, type RunEvent } from "@/lib/hermes";
import { validateToken } from "@/lib/auth";

/**
 * Stream skill-execution events as newline-delimited JSON.
 *
 * Proxies through to Hermes' /v1/runs + /v1/runs/{run_id}/events (SSE).
 * The Console proxies so the browser only talks to one origin (the Console)
 * and never has to discover or authenticate against Hermes directly.
 *
 * We translate Hermes RunEvent shapes to the Console's own NDJSON event
 * format for backward compatibility with browser-side consumers.
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

  // Phrase the skill invocation as a natural-language prompt.
  // Hermes has skill-execution tools and will dispatch to the correct skill.
  const inputsStr = Object.entries(payload.inputs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const prompt = `Run skill ${payload.skill_id}${inputsStr ? ` with inputs: ${inputsStr}` : ""}${
    payload.delivery && payload.delivery !== "stream"
      ? `. Deliver output via ${payload.delivery}.`
      : ""
  }`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const encode = (obj: unknown) =>
        encoder.encode(JSON.stringify(obj) + "\n");

      try {
        // Start the async run and immediately emit run_id
        const { run_id } = await hermes().startRun({ input: prompt });
        controller.enqueue(encode({ type: "start", run_id }));

        // Consume SSE events and translate to the Console's event shape
        for await (const ev of hermes().runEvents(run_id)) {
          const translated = translateRunEvent(ev);
          if (translated) controller.enqueue(encode(translated));
        }
      } catch (err) {
        controller.enqueue(
          encode({ type: "error", message: (err as Error).message }),
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

/** Translate a Hermes RunEvent to the Console's SkillRunEvent shape. */
function translateRunEvent(ev: RunEvent): Record<string, unknown> | null {
  switch (ev.event) {
    case "message.delta":
      return { type: "delta", text: ev.delta };
    case "tool.started":
      return { type: "tool", tool: ev.tool_name, status: "start" };
    case "tool.completed":
      return { type: "tool", tool: ev.tool_name, status: "complete" };
    case "run.completed":
      return { type: "done", final_response: ev.output };
    case "run.failed":
      return { type: "error", message: ev.error };
    default:
      return null;
  }
}
