"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Play, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Skill } from "@/lib/skills";

type RunEvent =
  | { type: "start"; run_id: string }
  | { type: "log"; line: string }
  | { type: "tool"; tool: string; status: "start" | "complete" | "error" }
  | { type: "delta"; text: string }
  | { type: "artifact"; path: string; preview: string }
  | { type: "done"; final_response: string }
  | { type: "error"; message: string };

export function SkillRunner({ skill, token }: { skill: Skill; token: string }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [delta, setDelta] = useState("");
  const [artifact, setArtifact] = useState<{ path: string; preview: string } | null>(null);
  const [finalText, setFinalText] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setEvents([]);
    setDelta("");
    setArtifact(null);
    setFinalText(null);
    try {
      const res = await fetch("/api/skills/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skill_id: skill.id, inputs }),
      });
      if (!res.ok || !res.body) {
        setEvents((e) => [...e, { type: "error", message: `Server returned ${res.status}` }]);
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
            const evt = JSON.parse(line) as RunEvent;
            setEvents((e) => [...e, evt]);
            if (evt.type === "delta") setDelta((d) => d + evt.text);
            if (evt.type === "artifact") setArtifact({ path: evt.path, preview: evt.preview });
            if (evt.type === "done") setFinalText(evt.final_response);
          } catch {
            /* parse error — skip */
          }
        }
      }
    } catch (err) {
      setEvents((e) => [...e, { type: "error", message: (err as Error).message }]);
    } finally {
      setRunning(false);
    }
  }

  const required = (skill.fm.inputs ?? []).filter((i) => i.required);
  const ready = required.every((i) => inputs[i.name]?.trim());
  const hasOutput = events.length > 0 || delta || artifact || finalText;

  const toolEvents = events.filter((e) => e.type === "tool");
  const errorEvent = events.find((e) => e.type === "error");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Input panel */}
      <Card className="p-5">
        <div className="space-y-4">
          {(skill.fm.inputs ?? []).length === 0 && (
            <div className="rounded border border-dashed border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-4 py-8 text-center">
              <p className="text-sm text-[hsl(var(--fg-secondary))]">
                No inputs required.
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--fg-dim))]">
                This skill runs from vault context only.
              </p>
            </div>
          )}
          {(skill.fm.inputs ?? []).map((input) => {
            const isLong = input.description?.length > 60;
            return (
              <div key={input.name} className="space-y-1.5">
                <label className="flex items-baseline justify-between">
                  <span className="label-uppercase">
                    {input.name}
                    {input.required && (
                      <span className="ml-1 text-[hsl(var(--status-err))]">*</span>
                    )}
                  </span>
                  {!input.required && (
                    <span className="text-[10px] text-[hsl(var(--fg-dim))]">optional</span>
                  )}
                </label>
                <p className="text-xs text-[hsl(var(--fg-dim))]">{input.description}</p>
                {isLong ? (
                  <Textarea
                    value={inputs[input.name] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [input.name]: e.target.value })}
                    className="font-mono text-[13px]"
                    rows={4}
                  />
                ) : (
                  <Input
                    value={inputs[input.name] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [input.name]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
          <Button
            disabled={!ready || running}
            onClick={run}
            className="h-12 w-full text-sm"
          >
            {running ? (
              <span className="inline-flex items-center gap-3">
                <span className="running-dots">
                  <span /><span /><span />
                </span>
                Running…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Play className="h-3.5 w-3.5" />
                Run skill
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* Output panel */}
      <div className="space-y-3">
        {!hasOutput && !running && (
          <div className="flex h-[200px] items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[hsl(var(--border-default))] bg-transparent">
            <div className="text-center">
              <FileText className="mx-auto h-6 w-6 text-[hsl(var(--fg-dim))]" />
              <p className="mt-3 text-sm text-[hsl(var(--fg-dim))]">
                Artifact will appear here
              </p>
              <p className="mt-1 font-mono text-[10px] text-[hsl(var(--fg-dim))]">
                {skill.fm.output_artifact}
              </p>
            </div>
          </div>
        )}

        {(running || (toolEvents.length > 0 && !artifact && !finalText)) && (
          <Card className="p-4">
            <div className="label-uppercase mb-3">Stream</div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {toolEvents.map((e, i) => (
                <div
                  key={i}
                  className="font-mono text-[11px] text-[hsl(var(--fg-dim))] flex items-center gap-2"
                >
                  <span className="text-[hsl(var(--accent-base))]">·</span>
                  {e.type === "tool" && (
                    <>
                      <span>{e.tool}</span>
                      <span className="opacity-60">{e.status}</span>
                    </>
                  )}
                </div>
              ))}
              {delta && (
                <div className="mt-3 text-sm leading-relaxed text-[hsl(var(--fg-secondary))] whitespace-pre-wrap">
                  {delta}
                </div>
              )}
            </div>
          </Card>
        )}

        {artifact && (
          <div className="artifact-reveal rounded-[var(--radius)] border border-[hsl(var(--accent-base)/0.4)] bg-[hsl(var(--accent-dim))] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="label-uppercase text-[hsl(var(--accent-base))]">
                Artifact
              </span>
              <span className="font-mono text-[10px] text-[hsl(var(--fg-secondary))]">
                {artifact.path}
              </span>
            </div>
            <div className="rounded bg-[hsl(var(--bg-surface))] p-3 max-h-96 overflow-y-auto">
              <pre className="font-mono text-xs leading-relaxed text-[hsl(var(--fg-primary))] whitespace-pre-wrap">
                {artifact.preview}
              </pre>
            </div>
            <Link
              href={`/wiki/${artifact.path.replace(/^wiki\//, "").replace(/\.md$/, "")}`}
              className={cn(
                "mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 text-xs font-medium",
                "text-[hsl(var(--fg-primary))] transition-colors hover:border-[hsl(var(--border-strong))]",
              )}
            >
              Open in Wiki
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {finalText && !artifact && (
          <Card className="p-4">
            <div className="label-uppercase mb-3">Output</div>
            <div className="markdown-body text-sm whitespace-pre-wrap">{finalText}</div>
          </Card>
        )}

        {errorEvent && errorEvent.type === "error" && (
          <Card className="p-4 border-[hsl(var(--status-err))]">
            <div className="label-uppercase text-[hsl(var(--status-err))] mb-2">Error</div>
            <p className="font-mono text-xs text-[hsl(var(--fg-secondary))]">
              {errorEvent.message}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
