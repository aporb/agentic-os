"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function IngestZone({ token }: { token: string }) {
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    setBusy(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/sources/upload", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          const data = (await res.json()) as { path: string };
          setLast(`Saved → ${data.path}`);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function ingestUrl() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sources/url", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = (await res.json()) as { path: string };
        setLast(`Saved → ${data.path}`);
        setUrl("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feed your second brain</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors",
            over ? "border-primary bg-primary/5" : "border-border",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) void uploadFiles(files);
          }}
        >
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm">Drop PDFs, transcripts, or markdown files</p>
          <p className="text-xs text-muted-foreground">
            They land in <code>sources/</code> as <code>status: unread</code>
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Paste a URL to ingest…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={ingestUrl} disabled={busy || !url.trim()}>
            Ingest
          </Button>
        </div>

        {last && <p className="text-xs text-muted-foreground">{last}</p>}
      </CardContent>
    </Card>
  );
}
