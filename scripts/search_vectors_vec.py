#!/usr/bin/env python3
"""
Vector search using sqlite-vec native distance (faster than upstream's
Python cosine path).

Reads from `vec_pages` (vec0 virtual table populated by setup_sqlite_vec.py)
joined to `pages` and `vector_embeddings` for path/title/chunk metadata.

Same CLI + NDJSON output as upstream search_vectors.py:
    {"path": "...", "title": "...", "score": 0.83, "chunk": "..."}

Usage:
    python3 scripts/search_vectors_vec.py "founder coordination cost" --top 5

Env:
    AGENTIC_OS_VAULT — vault path (must contain vault.db with vec_pages)
    OPENROUTER_API_KEY — for query embedding
    AGENTIC_OS_EMBED_MODEL — embedding model (default openai/text-embedding-3-small)
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import struct
import sys
import urllib.request
from pathlib import Path

import sqlite_vec


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


def embed_query(text: str, api_key: str) -> bytes:
    body = json.dumps({"model": EMBED_MODEL, "input": [text]}).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/embeddings",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read())
    vec = payload["data"][0]["embedding"]
    return struct.pack(f"{len(vec)}f", *vec)


def main() -> int:
    ap = argparse.ArgumentParser(description="sqlite-vec native vector search over vault.db")
    ap.add_argument("query")
    ap.add_argument("--top", type=int, default=5)
    ap.add_argument("--min-score", type=float, default=0.0,
                    help="Drop matches with cosine similarity below this (0–1)")
    args = ap.parse_args()

    vault = resolve_vault()
    db_path = vault / "vault.db"
    if not db_path.exists():
        sys.exit(f"[search-vec] no vault.db at {db_path}")

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        env_file = Path.home() / ".hermes" / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("OPENROUTER_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not api_key:
        sys.exit("[search-vec] OPENROUTER_API_KEY not set")

    db = sqlite3.connect(str(db_path))
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)

    # Verify vec_pages exists; if not, fall back to legacy
    has_vec = db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='vec_pages'"
    ).fetchone() is not None
    if not has_vec:
        sys.exit("[search-vec] vec_pages not found — run setup_sqlite_vec.py first or use search_vectors.py (legacy)")

    # Embed the query
    q_blob = embed_query(args.query, api_key)

    # Native vec0 distance query — pull more chunks than --top so we can
    # dedupe to unique pages (best chunk per page wins).
    fetch_k = max(args.top * 5, 20)
    rows = db.execute("""
        SELECT v.chunk_id, v.distance, p.path, p.title, ve.chunk_text
        FROM vec_pages v
        JOIN vector_embeddings ve ON ve.id = v.chunk_id
        JOIN pages p ON p.id = ve.page_id
        WHERE v.embedding MATCH ? AND v.k = ?
        ORDER BY v.distance
    """, (q_blob, fetch_k)).fetchall()

    # vec0 returns L2 distance for float vectors. Convert to cosine-like
    # similarity score by assuming unit-length embeddings (OpenAI/qwen
    # typically normalize): cos_sim = 1 - distance²/2 for unit vectors.
    # Expose `score` as 1 - distance/2 so 1.0 = identical, 0.0 = opposite,
    # matching the convention of search_vectors.py (cosine similarity).
    seen_paths = set()
    emitted = 0
    for chunk_id, distance, path, title, chunk_text in rows:
        if path in seen_paths:
            continue  # dedupe — best chunk per page already seen
        seen_paths.add(path)
        score = max(0.0, 1.0 - distance / 2.0)
        if score < args.min_score:
            continue
        preview = chunk_text[:200].replace("\n", " ").strip() if chunk_text else ""
        print(json.dumps({
            "path": path,
            "title": title or "",
            "score": round(score, 4),
            "chunk": preview,
        }))
        emitted += 1
        if emitted >= args.top:
            break

    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
