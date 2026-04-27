#!/usr/bin/env python3
"""
Vector search helper for the agentic-os vault.

Reads vault.db, embeds the query via OpenRouter, computes cosine
similarity against vector_embeddings, returns the top-N matches.

Designed to be invoked by Hermes skills that need semantic search:

    python3 scripts/search_vectors.py "founder coordination cost" --top 5

Returns NDJSON on stdout (one match per line):
    {"path": "...", "title": "...", "score": 0.83, "chunk": "..."}
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sqlite3
import struct
import sys
import urllib.request
from pathlib import Path

EMBED_MODEL = os.environ.get("AGENTIC_OS_EMBED_MODEL", "openai/text-embedding-3-small")


def resolve_vault() -> Path:
    env = os.environ.get("AGENTIC_OS_VAULT")
    if env:
        return Path(env).expanduser().resolve()
    cfg_path = Path.home() / ".hermes" / "agentic-os" / "config.json"
    if cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text())
            if cfg.get("vault_path"):
                return Path(cfg["vault_path"]).expanduser().resolve()
        except (json.JSONDecodeError, OSError):
            pass
    return Path.home() / "Documents" / "Second Brain"


def embed_query(text: str, api_key: str) -> list[float]:
    body = json.dumps({"model": EMBED_MODEL, "input": [text]}).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/embeddings",
        data=body,
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/aporb/agentic-os",
            "X-Title": "Agentic OS Console",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.load(resp)
    return data["data"][0]["embedding"]


def cosine(a: list[float], b: list[float]) -> float:
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    denom = math.sqrt(na) * math.sqrt(nb)
    return dot / denom if denom else 0.0


def blob_to_vec(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


def main() -> int:
    parser = argparse.ArgumentParser(description="Vector search over vault.db")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--min-score", type=float, default=0.0)
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print(json.dumps({"error": "OPENROUTER_API_KEY not set"}), file=sys.stderr)
        return 2

    vault = resolve_vault()
    db_path = vault / "vault.db"
    if not db_path.exists():
        print(json.dumps({"error": f"vault.db not found at {db_path} — run scripts/index_vault.py"}), file=sys.stderr)
        return 2

    qvec = embed_query(args.query, api_key)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT v.page_id, v.chunk_idx, v.chunk_text, v.vector, p.path, p.title
          FROM vector_embeddings v
          JOIN pages p ON p.id = v.page_id
        """,
    )

    scored = []
    for row in cur.fetchall():
        vec = blob_to_vec(row["vector"])
        score = cosine(qvec, vec)
        if score < args.min_score:
            continue
        scored.append(
            {
                "path": row["path"],
                "title": row["title"],
                "chunk": row["chunk_text"][:300],
                "score": round(score, 4),
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    seen = set()
    for hit in scored:
        if hit["path"] in seen:
            continue
        seen.add(hit["path"])
        print(json.dumps(hit))
        if len(seen) >= args.top:
            break

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
