"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Status = "draft" | "reviewed" | "stable" | "unread" | "reading" | "processed";

const ALLOWED: Status[] = ["draft", "reviewed", "stable"];

export function FrontmatterEditor({
  path,
  initialStatus,
  initialTags,
  token,
}: {
  path: string;
  initialStatus?: Status;
  initialTags: string[];
  token: string;
}) {
  const [status, setStatus] = useState<Status | undefined>(initialStatus);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/vault/${encodeURIComponent(path)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ frontmatter: { status, tags } }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        {ALLOWED.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className="dense"
          >
            <Badge variant={status === s ? "default" : "outline"} className="cursor-pointer">
              {s}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tags
        </span>
        {tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setTags(tags.filter((x) => x !== t))}
          >
            {t} ×
          </Badge>
        ))}
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagDraft.trim()) {
              setTags([...tags, tagDraft.trim()]);
              setTagDraft("");
            }
          }}
          placeholder="add tag…"
          className="dense rounded border border-input bg-background px-2 py-0.5 text-xs"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </Button>
      </div>
    </div>
  );
}
