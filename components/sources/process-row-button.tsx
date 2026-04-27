"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type State =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; run_id: string }
  | { kind: "error"; message: string };

export function ProcessRowButton({
  path,
  token,
}: {
  path: string;
  token: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function process(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setState({ kind: "running" });
    try {
      const res = await fetch("/api/sources/process", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path }),
      });
      const data = (await res.json()) as
        | { run_id: string; path: string }
        | { error: string };
      if ("error" in data) {
        setState({ kind: "error", message: data.error });
        return;
      }
      setState({ kind: "ok", run_id: data.run_id });
      // Refresh the page after a short delay so status will update once
      // the agent is done. The user can also refresh manually.
      setTimeout(() => router.refresh(), 30000);
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  return (
    <button
      onClick={process}
      disabled={state.kind === "running" || state.kind === "ok"}
      title={state.kind === "error" ? state.message : "Process this source"}
      className={cn(
        "dense inline-flex h-6 items-center justify-center gap-1 rounded px-1.5 text-[10px] font-medium transition-colors",
        state.kind === "ok"
          ? "bg-[hsl(var(--status-ok-dim))] text-[hsl(var(--status-ok))]"
          : state.kind === "error"
            ? "bg-[hsl(var(--status-err-dim))] text-[hsl(var(--status-err))]"
            : "border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] text-[hsl(var(--fg-secondary))] hover:border-[hsl(var(--accent-base))] hover:text-[hsl(var(--accent-base))]",
        "disabled:cursor-not-allowed shrink-0",
      )}
    >
      {state.kind === "running" ? (
        <span className="running-dots">
          <span /><span /><span />
        </span>
      ) : state.kind === "ok" ? (
        <>
          <Check className="h-2.5 w-2.5" />
          queued
        </>
      ) : state.kind === "error" ? (
        <>
          <AlertCircle className="h-2.5 w-2.5" />
          err
        </>
      ) : (
        <>
          <Sparkles className="h-2.5 w-2.5" />
          process
        </>
      )}
    </button>
  );
}
