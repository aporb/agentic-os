/**
 * Loads runtime config for the Agentic OS Console.
 *
 * Config sources, in priority order:
 *   1. Process env (AGENTIC_OS_*)
 *   2. ~/.hermes/agentic-os/config.json (written by hermes/install.sh)
 *   3. Defaults
 *
 * The Hermes bridge writes config.json after the install wizard. The Next.js
 * server reads it on every request (cheap — small file, OS-cached).
 */

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Config = {
  vault_path: string;
  port: number;
  host: string;
  agent_name: string;
  hermes_api_url: string;
  hermes_token: string | null;
  last_check_for_updates: number | null;
  install_id: string;
};

const DEFAULTS: Omit<Config, "vault_path" | "install_id"> = {
  port: 18443,
  host: "127.0.0.1",
  agent_name: "your assistant",
  hermes_api_url: "http://127.0.0.1:7421",
  hermes_token: null,
  last_check_for_updates: null,
};

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;

  const configPath =
    process.env.AGENTIC_OS_CONFIG ??
    join(homedir(), ".hermes", "agentic-os", "config.json");

  let fromFile: Partial<Config> = {};
  if (existsSync(configPath)) {
    try {
      fromFile = JSON.parse(readFileSync(configPath, "utf8")) as Partial<Config>;
    } catch (err) {
      console.warn(`[config] failed to parse ${configPath}:`, err);
    }
  }

  const fromEnv: Partial<Config> = {
    vault_path: process.env.AGENTIC_OS_VAULT,
    port: process.env.AGENTIC_OS_PORT ? Number(process.env.AGENTIC_OS_PORT) : undefined,
    host: process.env.AGENTIC_OS_HOST,
    agent_name: process.env.AGENTIC_OS_AGENT_NAME,
    hermes_api_url: process.env.HERMES_API_URL,
    hermes_token: process.env.HERMES_TOKEN ?? null,
  } as Partial<Config>;

  const merged: Config = {
    ...DEFAULTS,
    install_id: "unknown",
    vault_path: join(homedir(), "Documents", "Second Brain"),
    ...fromFile,
    ...Object.fromEntries(
      Object.entries(fromEnv).filter(([, v]) => v !== undefined),
    ),
  } as Config;

  cached = merged;
  return merged;
}

export function clearConfigCache() {
  cached = null;
}
