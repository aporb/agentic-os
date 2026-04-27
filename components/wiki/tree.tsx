"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, FileText, FolderClosed } from "lucide-react";
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
            "flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-secondary/60",
            depth === 0 ? "font-semibold" : "",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <FolderClosed className="h-3 w-3 text-muted-foreground" />
          <span>{node.name}</span>
          {node.children && (
            <span className="ml-auto text-xs text-muted-foreground">{node.children.length}</span>
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
  return (
    <Link
      href={`/wiki/${slug}`}
      className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      style={{ paddingLeft: `${depth * 12 + 8 + 12}px` }}
    >
      <FileText className="h-3 w-3" />
      <span className="truncate">{node.name.replace(/\.md$/, "")}</span>
    </Link>
  );
}
