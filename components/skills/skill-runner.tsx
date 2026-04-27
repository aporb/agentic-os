"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2 } from "lucide-react";
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
  const [artifact, setArtifact] = useState<{ path: string; preview: string } | null>(null);

  async function run() {
    setRunning(true);
    setEvents([]);
    setArtifact(null);
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
        setEvents((e) => [
          ...e,
          { type: "error", message: `Server returned ${res.status}` },
        ]);
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
            if (evt.type === "artifact") setArtifact({ path: evt.path, preview: evt.preview });
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      setEvents((e) => [
        ...e,
        { type: "error", message: (err as Error).message },
      ]);
    } finally {
      setRunning(false);
    }
  }

  const required = (skill.fm.inputs ?? []).filter((i) => i.required);
  const ready = required.every((i) => inputs[i.name]?.trim());

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
          <p className="text-xs text-muted-foreground">{skill.fm.description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(skill.fm.inputs ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No inputs required.</p>
          )}
          {(skill.fm.inputs ?? []).map((input) => (
            <div key={input.name} className="space-y-1">
              <label className="block text-sm font-medium">
                {input.name}
                {input.required && <span className="text-destructive"> *</span>}
              </label>
              <p className="text-xs text-muted-foreground">{input.description}</p>
              {input.description?.length > 60 ? (
                <Textarea
                  value={inputs[input.name] ?? ""}
                  onChange={(e) =>
                    setInputs({ ...inputs, [input.name]: e.target.value })
                  }
                />
              ) : (
                <Input
                  value={inputs[input.name] ?? ""}
                  onChange={(e) =>
                    setInputs({ ...inputs, [input.name]: e.target.value })
                  }
                />
              )}
            </div>
          ))}
          <Button disabled={!ready || running} onClick={run} className="w-full">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run skill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 && !artifact && (
            <p className="text-sm text-muted-foreground">
              Run the skill to see streaming output.
            </p>
          )}
          {events.length > 0 && (
            <div className="mb-4 max-h-96 overflow-y-auto rounded-md bg-muted p-3 font-mono text-xs">
              {events.map((e, i) => (
                <EventLine key={i} evt={e} />
              ))}
            </div>
          )}
          {artifact && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Artifact
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {artifact.path}
                </Badge>
              </div>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
                {artifact.preview}
              </pre>
              <a
                href={`/wiki/${artifact.path.replace(/^wiki\//, "").replace(/\.md$/, "")}`}
                className="inline-block text-xs underline"
              >
                Open artifact →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventLine({ evt }: { evt: RunEvent }) {
  const text = (() => {
    switch (evt.type) {
      case "start":
        return `▶ start ${evt.run_id}`;
      case "log":
        return evt.line;
      case "tool":
        return `· ${evt.tool} ${evt.status}`;
      case "delta":
        return evt.text;
      case "artifact":
        return `📝 wrote ${evt.path}`;
      case "done":
        return `✓ done`;
      case "error":
        return `✗ ${evt.message}`;
    }
  })();
  const cls = evt.type === "error" ? "text-destructive" : evt.type === "delta" ? "" : "text-muted-foreground";
  return <div className={cls}>{text}</div>;
}
