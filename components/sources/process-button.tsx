"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Sparkles, Check, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

type Result =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; run_id: string; count: number }
  | { kind: "error"; message: string };

export function ProcessUnreadButton({
  unreadCount,
  token,
}: {
  unreadCount: number;
  token: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<Result>({ kind: "idle" });

  async function process() {
    setState({ kind: "running" });
    try {
      const res = await fetch("/api/sources/process-all", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as
        | { run_id: string; count: number }
        | { error: string };
      if ("error" in data) {
        setState({ kind: "error", message: data.error });
        return;
      }
      setState({ kind: "ok", run_id: data.run_id, count: data.count });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  if (unreadCount === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="label-uppercase">Ingest queue</div>
          <p className="mt-1 text-sm text-[hsl(var(--fg-secondary))]">
            <span className="font-mono text-[hsl(var(--fg-primary))]">
              {unreadCount}
            </span>{" "}
            unread {unreadCount === 1 ? "source" : "sources"} ready to be
            synthesized into the wiki.
          </p>
        </div>
        <button
          onClick={process}
          disabled={state.kind === "running" || state.kind === "ok"}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
            "bg-[hsl(var(--accent-base))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shrink-0",
          )}
        >
          {state.kind === "running" ? (
            <>
              <span className="running-dots">
                <span /><span /><span />
              </span>
              Starting…
            </>
          ) : state.kind === "ok" ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Started
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Process {unreadCount} unread
            </>
          )}
        </button>
      </div>

      {state.kind === "ok" && (
        <div className="border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--accent-dim))]/40 px-4 py-3 dense">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[hsl(var(--fg-primary))]">
                Hermes is processing {state.count}{" "}
                {state.count === 1 ? "source" : "sources"} in the background.
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--fg-dim))]">
                Run{" "}
                <code className="font-mono text-[hsl(var(--fg-secondary))]">
                  {state.run_id.slice(0, 12)}
                </code>{" "}
                · refresh in a couple of minutes to see new wiki pages and
                source statuses move to <span className="font-mono">processed</span>.
              </p>
            </div>
            <button
              onClick={() => router.refresh()}
              className="dense inline-flex h-7 items-center gap-1 rounded border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-2 text-[10px] font-medium text-[hsl(var(--fg-secondary))] hover:text-[hsl(var(--fg-primary))]"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--status-err-dim))]/60 px-4 py-3 dense">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[hsl(var(--status-err))] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[hsl(var(--fg-primary))]">
                Couldn&apos;t start the ingest run.
              </p>
              <p className="mt-1 font-mono text-[10px] text-[hsl(var(--fg-secondary))]">
                {state.message}
              </p>
              <p className="mt-1 text-[10px] text-[hsl(var(--fg-dim))]">
                Check that Hermes&apos; api_server is enabled and try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
