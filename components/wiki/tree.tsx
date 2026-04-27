"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { VaultTreeNode } from "@/lib/vault";

export function WikiTree({ root }: { root: VaultTreeNode }) {
  return (
    <div className="dense space-y-0.5">
      {(root.children ?? []).map((child) => (
        <Node key={child.path} node={child} depth={0} />
      ))}
    </div>
  );
}

function Node({ node, depth }: { node: VaultTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-[hsl(var(--bg-elevated))]",
            depth === 0
              ? "font-semibold text-[hsl(var(--fg-primary))]"
              : "text-[hsl(var(--fg-secondary))]",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? (
            <ChevronDown className="h-3 w-3 text-[hsl(var(--fg-dim))]" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[hsl(var(--fg-dim))]" />
          )}
          <span>{node.name}</span>
          {node.children && (
            <span className="ml-auto font-mono text-[10px] text-[hsl(var(--fg-dim))]">
              {node.children.filter((c) => c.type === "file" && c.path.endsWith(".md")).length || node.children.length}
            </span>
          )}
        </button>
        {open && (
          <div>
            {(node.children ?? []).map((c) => (
              <Node key={c.path} node={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (!node.path.endsWith(".md")) return null;
  const slug = node.path.replace(/\.md$/, "");
  const baseName = node.name.replace(/\.md$/, "");
  return (
    <Link
      href={`/wiki/${slug}`}
      className="group flex items-center gap-1.5 rounded px-2 py-1 text-sm text-[hsl(var(--fg-dim))] transition-colors hover:bg-[hsl(var(--bg-elevated))] hover:text-[hsl(var(--fg-primary))]"
      style={{ paddingLeft: `${depth * 12 + 8 + 12}px` }}
    >
      <span className="text-[hsl(var(--fg-dim))] opacity-50 group-hover:opacity-100">·</span>
      <span className="truncate">{baseName}</span>
    </Link>
  );
}
