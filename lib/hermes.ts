/**
 * Hermes Agent runtime client.
 *
 * Talks to a locally-running Hermes via its api_server gateway platform.
 * Default endpoint http://127.0.0.1:7421 (configurable via HERMES_API_URL).
 *
 * The Console reads from Hermes (sessions, crons, model config) and writes
 * to it via the bridge (cron CRUD, skill execution). The bridge handles
 * all mutation; this client is read-mostly.
 *
 * NOTE: Hermes' api_server endpoints are an evolving surface. This client
 * codes against the shape we expect; the Hermes bridge skills will adapt
 * if specifics drift. See spec §12 deferred decision #5.
 */

import { getConfig } from "./config";

export type HermesSession = {
  session_id: string;
  platform: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  title?: string;
};

export type HermesCron = {
  name: string;
  schedule: string; // cron expression or human-readable
  prompt: string;
  skills?: string[];
  delivery: string; // "telegram" | "discord" | "local" | etc.
  next_run_at?: string;
  last_run_at?: string;
  last_status?: "ok" | "error" | "silent";
};

export type HermesStatus = {
  running: boolean;
  pid?: number;
  uptime_s?: number;
  model?: string;
  provider?: string;
  active_session_count?: number;
};

export type SkillRunRequest = {
  skill_id: string; // e.g. "agentic-os/ceo/competitor-research"
  inputs: Record<string, string>;
  delivery?: "stream" | "wiki" | "telegram";
};

export type SkillRunEvent =
  | { type: "start"; run_id: string }
  | { type: "log"; line: string }
  | { type: "tool"; tool: string; status: "start" | "complete" | "error" }
  | { type: "delta"; text: string }
  | { type: "artifact"; path: string; preview: string }
  | { type: "done"; final_response: string }
  | { type: "error"; message: string };

class HermesClient {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    const cfg = getConfig();
    this.baseUrl = cfg.hermes_api_url.replace(/\/$/, "");
    this.token = cfg.hermes_token;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h["authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async status(): Promise<HermesStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/status`, {
        headers: this.headers(),
      });
      if (!res.ok) return { running: false };
      return (await res.json()) as HermesStatus;
    } catch {
      return { running: false };
    }
  }

  async listSessions(limit = 5): Promise<HermesSession[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/v1/sessions?limit=${limit}`,
        { headers: this.headers() },
      );
      if (!res.ok) return [];
      return (await res.json()) as HermesSession[];
    } catch {
      return [];
    }
  }

  async listCrons(): Promise<HermesCron[]> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/cron`, {
        headers: this.headers(),
      });
      if (!res.ok) return [];
      return (await res.json()) as HermesCron[];
    } catch {
      return [];
    }
  }

  /**
   * Execute a skill via the bridge. Returns an async iterator of events
   * for streaming UIs. The actual transport may be SSE or chunked JSON
   * depending on Hermes' api_server capabilities; both are abstracted here.
   */
  async *runSkill(
    req: SkillRunRequest,
  ): AsyncGenerator<SkillRunEvent, void, void> {
    const res = await fetch(`${this.baseUrl}/v1/skills/run`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok || !res.body) {
      yield {
        type: "error",
        message: `Hermes returned ${res.status} ${res.statusText}`,
      };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          yield JSON.parse(line) as SkillRunEvent;
        } catch (err) {
          console.warn("[hermes] could not parse line:", line, err);
        }
      }
    }
  }

  /**
   * Register a new cron via the bridge.
   * The bridge's cron-register skill calls Hermes' cron CRUD on our behalf.
   */
  async registerCron(cron: Omit<HermesCron, "next_run_at" | "last_run_at" | "last_status">): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/cron`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(cron),
    });
    if (!res.ok) {
      throw new Error(`Failed to register cron: ${res.status} ${res.statusText}`);
    }
  }
}

let cached: HermesClient | null = null;
export function hermes(): HermesClient {
  if (!cached) cached = new HermesClient();
  return cached;
}
