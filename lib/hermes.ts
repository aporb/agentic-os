/**
 * Hermes Agent runtime client.
 *
 * Targets the REAL api_server gateway platform endpoints discovered at:
 *   /home/amynporb/.hermes/hermes-agent/gateway/platforms/api_server.py
 *
 * Default port: 8642 (NOT 7421 — that was an incorrect assumption).
 * Override with HERMES_API_URL env var.
 *
 * Auth: Bearer token via HERMES_TOKEN env var. Optional for localhost
 * when api_server.key is not configured in Hermes config.yaml.
 *
 * IMPORTANT — Sessions: no HTTP endpoint exists in Hermes for listing sessions.
 * Read ~/.hermes/state.db directly via better-sqlite3 from Next.js API routes.
 * Use readSessionsFromDisk() and related disk helpers exported below.
 *
 * IMPORTANT — Enable api_server: the platform is OFF by default.
 * Add to systemd service or shell env before restarting hermes-gateway:
 *   API_SERVER_ENABLED=true
 *   API_SERVER_CORS_ORIGINS=http://localhost:18443
 */

import { getConfig } from "./config";
import fs from "fs";
import path from "path";
import os from "os";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type HermesJob = {
  id: string;          // 12-char hex, e.g. "d0ba17389526"
  name: string;
  prompt: string;
  skills: string[];
  schedule: {
    kind: "cron" | "once";
    expr: string;
    display: string;
  };
  schedule_display: string;
  enabled: boolean;
  state: "scheduled" | "running" | "paused" | "completed" | "failed";
  next_run_at: string | null;   // ISO8601
  last_run_at: string | null;   // ISO8601
  last_status: "ok" | "error" | "silent" | null;
  last_error: string | null;
  deliver: "telegram" | "discord" | "local" | string;
  created_at: string;           // ISO8601
  origin?: {
    platform: string;
    chat_id: string;
    chat_name: string;
    thread_id: string | null;
  };
};

export type HermesCreateJobRequest = {
  name: string;
  schedule: string;     // cron expression, e.g. "0 4 * * *"
  prompt: string;
  deliver?: string;     // "local" | "telegram" | etc.
  skills?: string[];
  repeat?: number | null;
};

export type HermesStatus = {
  running: boolean;
  gateway_state?: string;
  platforms?: Record<
    string,
    {
      state: string;
      error_code?: string | null;
      error_message?: string | null;
      updated_at?: string;
    }
  >;
  active_agents?: number;
  pid?: number;
  updated_at?: string;
};

export type HermesSession = {
  id: string;           // e.g. "20260426_203309_a3971d90"
  source: string;       // "telegram" | "cli" | "api_server" | etc.
  title: string | null;
  started_at: number;   // Unix timestamp (float seconds)
  ended_at: number | null;
  message_count: number;
  preview?: string;     // First 60 chars of first user message
  last_active?: number; // Unix timestamp of last message
};

export type RunStartResponse = {
  run_id: string;
  status: "started";
};

export type RunEvent =
  | {
      event: "message.delta";
      run_id: string;
      timestamp: number;
      delta: string;
    }
  | {
      event: "tool.started";
      run_id: string;
      timestamp: number;
      tool_name: string;
      preview?: string;
    }
  | {
      event: "tool.completed";
      run_id: string;
      timestamp: number;
      tool_name: string;
      preview?: string;
    }
  | {
      event: "run.completed";
      run_id: string;
      timestamp: number;
      output: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    }
  | {
      event: "run.failed";
      run_id: string;
      timestamp: number;
      error: string;
    };

// --------------------------------------------------------------------------
// HTTP Client
// --------------------------------------------------------------------------

class HermesClient {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    const cfg = getConfig();
    // Hermes api_server default port is 8642 (NOT 7421)
    this.baseUrl = (cfg.hermes_api_url ?? "http://127.0.0.1:8642").replace(/\/$/, "");
    this.token = cfg.hermes_token ?? null;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h["authorization"] = `Bearer ${this.token}`;
    return extra ? { ...h, ...extra } : h;
  }

  // ------------------------------------------------------------------------
  // Health / Status
  // GET /health/detailed — no auth required
  // Falls back to { running: false } on any connection error.
  // ------------------------------------------------------------------------

  async status(): Promise<HermesStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/health/detailed`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return { running: false };
      const data = (await res.json()) as {
        status: string;
        gateway_state?: string;
        platforms?: Record<
          string,
          {
            state: string;
            error_code?: string | null;
            error_message?: string | null;
            updated_at?: string;
          }
        >;
        active_agents?: number;
        pid?: number;
        updated_at?: string;
      };
      return {
        running: data.status === "ok",
        gateway_state: data.gateway_state,
        platforms: data.platforms,
        active_agents: data.active_agents,
        pid: data.pid,
        updated_at: data.updated_at,
      };
    } catch {
      return { running: false };
    }
  }

  // ------------------------------------------------------------------------
  // Cron Jobs — GET /api/jobs, POST /api/jobs, etc.
  // ------------------------------------------------------------------------

  /** List all cron jobs. Returns [] on error or when api_server is offline. */
  async listJobs(includeDisabled = false): Promise<HermesJob[]> {
    try {
      const url = `${this.baseUrl}/api/jobs${includeDisabled ? "?include_disabled=true" : ""}`;
      const res = await fetch(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { jobs: HermesJob[] };
      return data.jobs ?? [];
    } catch {
      return [];
    }
  }

  /** Create a cron job. Throws on failure. */
  async createJob(req: HermesCreateJobRequest): Promise<HermesJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create job: ${res.status} ${body}`);
    }
    const data = (await res.json()) as { job: HermesJob };
    return data.job;
  }

  /**
   * Update a cron job.
   * Allowed fields: name, schedule, prompt, deliver, skills, skill, repeat, enabled.
   */
  async updateJob(
    jobId: string,
    patch: Partial<{
      name: string;
      schedule: string;
      prompt: string;
      deliver: string;
      skills: string[];
      repeat: number | null;
      enabled: boolean;
    }>,
  ): Promise<HermesJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to update job: ${res.status} ${body}`);
    }
    const data = (await res.json()) as { job: HermesJob };
    return data.job;
  }

  /** Delete a cron job. */
  async deleteJob(jobId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to delete job: ${res.status} ${body}`);
    }
  }

  /** Pause a cron job. */
  async pauseJob(jobId: string): Promise<HermesJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}/pause`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Failed to pause job: ${res.status}`);
    return ((await res.json()) as { job: HermesJob }).job;
  }

  /** Resume a paused cron job. */
  async resumeJob(jobId: string): Promise<HermesJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}/resume`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Failed to resume job: ${res.status}`);
    return ((await res.json()) as { job: HermesJob }).job;
  }

  /** Trigger immediate execution of a cron job. */
  async triggerJob(jobId: string): Promise<HermesJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}/run`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`);
    return ((await res.json()) as { job: HermesJob }).job;
  }

  // ------------------------------------------------------------------------
  // Async Runs — POST /v1/runs + GET /v1/runs/{run_id}/events (SSE)
  // This is the correct way to execute a skill or run any agent prompt.
  // ------------------------------------------------------------------------

  /**
   * Start an async agent run. Returns immediately with run_id (HTTP 202).
   * Consume the structured event stream via runEvents(run_id).
   *
   * To invoke a skill, phrase the input as a natural-language prompt:
   *   "Run skill agentic-os/ceo/competitor-research with inputs: {\"company\": \"OpenAI\"}"
   */
  async startRun(options: {
    input: string;
    instructions?: string;
    sessionId?: string;
    previousResponseId?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<RunStartResponse> {
    const body: Record<string, unknown> = { input: options.input };
    if (options.instructions) body.instructions = options.instructions;
    if (options.sessionId) body.session_id = options.sessionId;
    if (options.previousResponseId)
      body.previous_response_id = options.previousResponseId;
    if (options.conversationHistory?.length)
      body.conversation_history = options.conversationHistory;

    const res = await fetch(`${this.baseUrl}/v1/runs`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to start run: ${res.status} ${err}`);
    }
    return res.json() as Promise<RunStartResponse>;
  }

  /**
   * Consume SSE stream of agent lifecycle events for a run.
   * Closes automatically when the run completes or fails.
   *
   * Usage:
   *   const { run_id } = await hermes().startRun({ input: "..." });
   *   for await (const ev of hermes().runEvents(run_id)) {
   *     if (ev.event === "message.delta") process.stdout.write(ev.delta);
   *     if (ev.event === "run.completed") console.log("Final:", ev.output);
   *   }
   */
  async *runEvents(runId: string): AsyncGenerator<RunEvent, void, void> {
    const res = await fetch(`${this.baseUrl}/v1/runs/${runId}/events`, {
      headers: { ...this.headers(), accept: "text/event-stream" },
    });
    if (!res.ok || !res.body) {
      throw new Error(`Failed to connect to run events: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, boundary);
          buf = buf.slice(boundary + 1);

          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw) as RunEvent;
            yield parsed;
            if (
              parsed.event === "run.completed" ||
              parsed.event === "run.failed"
            ) {
              return;
            }
          } catch {
            // SSE comment lines (": keepalive") are not JSON — skip silently
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  /** Interrupt a running agent. */
  async stopRun(runId: string): Promise<void> {
    await fetch(`${this.baseUrl}/v1/runs/${runId}/stop`, {
      method: "POST",
      headers: this.headers(),
    });
  }

  // ------------------------------------------------------------------------
  // OpenAI Chat Completions — POST /v1/chat/completions
  // Simpler one-shot alternative to the runs API.
  // ------------------------------------------------------------------------

  /**
   * Run a prompt against the Hermes agent, return the final text response.
   * Does not expose structured tool events — use startRun() + runEvents() for that.
   */
  async chat(
    userMessage: string,
    options?: {
      systemPrompt?: string;
      /** Session continuation — requires API key configured on Hermes side. */
      sessionId?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    },
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemPrompt)
      messages.push({ role: "system", content: options.systemPrompt });
    if (options?.history) messages.push(...options.history);
    messages.push({ role: "user", content: userMessage });

    const extraHeaders: Record<string, string> = {};
    if (options?.sessionId && this.token) {
      extraHeaders["X-Hermes-Session-Id"] = options.sessionId;
    }

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.headers(extraHeaders),
      body: JSON.stringify({ model: "hermes-agent", messages, stream: false }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  // ------------------------------------------------------------------------
  // Models
  // ------------------------------------------------------------------------

  async listModels(): Promise<
    Array<{ id: string; object: string; owned_by: string }>
  > {
    try {
      const res = await fetch(`${this.baseUrl}/v1/models`, {
        headers: this.headers(),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        data: Array<{ id: string; object: string; owned_by: string }>;
      };
      return data.data ?? [];
    } catch {
      return [];
    }
  }
}

// --------------------------------------------------------------------------
// Singleton
// --------------------------------------------------------------------------

let _cached: HermesClient | null = null;

export function hermes(): HermesClient {
  if (!_cached) _cached = new HermesClient();
  return _cached;
}

// --------------------------------------------------------------------------
// Disk helpers — use in Next.js API routes (server-side only)
// These are zero-latency fallbacks that work even when api_server is offline.
// --------------------------------------------------------------------------

const HERMES_HOME =
  process.env.HERMES_HOME ?? path.join(os.homedir(), ".hermes");

const STATE_DB_PATH = path.join(HERMES_HOME, "state.db");
const CRON_JOBS_PATH = path.join(HERMES_HOME, "cron", "jobs.json");
const GATEWAY_STATE_PATH = path.join(HERMES_HOME, "gateway_state.json");

/**
 * Read recent sessions directly from ~/.hermes/state.db (SQLite, WAL mode).
 * Server-side only. Requires better-sqlite3:
 *   npm install better-sqlite3 @types/better-sqlite3
 *
 * No HTTP endpoint exists in Hermes for listing sessions — this is the
 * canonical approach.
 */
export async function readSessionsFromDisk(
  limit = 20,
  source?: string,
): Promise<HermesSession[]> {
  try {
    const Database = (await import("better-sqlite3")).default;
    const db = new Database(STATE_DB_PATH, {
      readonly: true,
      fileMustExist: true,
    });
    db.pragma("journal_mode = WAL");

    let query = `
      SELECT
        s.id, s.source, s.title, s.started_at, s.ended_at, s.message_count,
        COALESCE(
          (SELECT SUBSTR(REPLACE(m.content, X'0A', ' '), 1, 63)
           FROM messages m
           WHERE m.session_id = s.id AND m.role = 'user' AND m.content IS NOT NULL
           ORDER BY m.timestamp, m.id LIMIT 1),
          ''
        ) AS preview,
        COALESCE(
          (SELECT MAX(m2.timestamp) FROM messages m2 WHERE m2.session_id = s.id),
          s.started_at
        ) AS last_active
      FROM sessions s
      WHERE s.parent_session_id IS NULL
    `;
    const params: (string | number)[] = [];
    if (source) {
      query += " AND s.source = ?";
      params.push(source);
    }
    query += " ORDER BY s.started_at DESC LIMIT ?";
    params.push(limit);

    const rows = db.prepare(query).all(...params) as HermesSession[];
    db.close();
    return rows;
  } catch (err) {
    console.warn("[hermes] readSessionsFromDisk failed:", err);
    return [];
  }
}

/**
 * Read cron jobs from ~/.hermes/cron/jobs.json.
 * Use as fallback when api_server is not running, or in SSG/ISR contexts.
 * Returns [] if the file is missing or malformed.
 */
export function readJobsFromDisk(): HermesJob[] {
  try {
    const raw = fs.readFileSync(CRON_JOBS_PATH, "utf8");
    const parsed = JSON.parse(raw) as { jobs: HermesJob[] };
    return parsed.jobs ?? [];
  } catch {
    return [];
  }
}

/**
 * Read gateway runtime state from ~/.hermes/gateway_state.json.
 * Always available — written by the gateway process, no HTTP needed.
 * Returns { running: false } if the file is missing (gateway never started).
 */
export function readGatewayStateFromDisk(): HermesStatus {
  try {
    const raw = fs.readFileSync(GATEWAY_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      gateway_state: string;
      platforms: Record<
        string,
        { state: string; error_code?: string | null; error_message?: string | null; updated_at?: string }
      >;
      active_agents: number;
      pid: number;
      updated_at: string;
    };
    return {
      running: parsed.gateway_state === "running",
      gateway_state: parsed.gateway_state,
      platforms: parsed.platforms,
      active_agents: parsed.active_agents,
      pid: parsed.pid,
      updated_at: parsed.updated_at,
    };
  } catch {
    return { running: false };
  }
}
