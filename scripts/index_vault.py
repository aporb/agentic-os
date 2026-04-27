#!/usr/bin/env python3
"""
Vault indexer — SQLite FTS5 + vector embeddings for the user's second brain.

Walks the configured vault directory, extracts YAML frontmatter and body
from every markdown file, and writes a SQLite index at
<vault>/vault.db with these tables:

    pages              one row per file (frontmatter + body_text + body_hash)
    tags               unique tag names
    page_tags          many-to-many
    pointers           breadcrumb references the agent uses for "where did I read this?"
    vector_embeddings  body chunks + their OpenAI-format vectors (one row per chunk)
    pages_fts          FTS5 virtual table over (path, title, body_text)

The indexer is idempotent: each page is hashed (sha256 of body), and we
only re-index pages whose hash has changed since the last run. This makes
the nightly vault-index-sync cron cheap (typically <2s on a 500-page vault).

Embeddings use OpenRouter — set OPENROUTER_API_KEY in the env. If the
key is missing the indexer skips embedding generation but still builds
the FTS5 index, so keyword search keeps working in the cheap path.

Usage:
    python3 scripts/index_vault.py [--vault PATH] [--no-embed] [--reindex]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterable

import yaml

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

DEFAULT_VAULT = Path.home() / "Documents" / "Second Brain"
EMBED_MODEL = os.environ.get("AGENTIC_OS_EMBED_MODEL", "openai/text-embedding-3-small")
EMBED_DIM = 1536
CHUNK_SIZE = 1500  # characters
CHUNK_OVERLAP = 150
ZONES = {"sources", "wiki", "journal", "schema"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def log(msg: str) -> None:
    print(f"[indexer] {msg}", file=sys.stderr, flush=True)


def parse_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    """Returns (frontmatter_dict, body)."""
    if not raw.startswith("---\n"):
        return {}, raw
    end = raw.find("\n---", 4)
    if end < 0:
        return {}, raw
    yaml_block = raw[4:end]
    body = raw[end + 4 :].lstrip("\n")
    try:
        fm = yaml.safe_load(yaml_block) or {}
    except yaml.YAMLError as err:
        log(f"yaml parse error: {err}")
        fm = {}
    if not isinstance(fm, dict):
        fm = {}
    return fm, body


def zone_of(rel_path: Path) -> str:
    head = rel_path.parts[0] if rel_path.parts else ""
    return head if head in ZONES else "other"


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= size:
        return [text]
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i : i + size])
        i += size - overlap
    return chunks


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


def init_db(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY,
            path TEXT UNIQUE NOT NULL,
            zone TEXT NOT NULL,
            title TEXT,
            status TEXT,
            created TEXT,
            updated TEXT,
            body_text TEXT,
            body_hash TEXT,
            frontmatter_json TEXT,
            indexed_at REAL
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS page_tags (
            page_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (page_id, tag_id),
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS pointers (
            id INTEGER PRIMARY KEY,
            from_path TEXT NOT NULL,
            to_path TEXT NOT NULL,
            kind TEXT,
            UNIQUE (from_path, to_path, kind)
        );

        CREATE TABLE IF NOT EXISTS vector_embeddings (
            id INTEGER PRIMARY KEY,
            page_id INTEGER NOT NULL,
            chunk_idx INTEGER NOT NULL,
            chunk_text TEXT NOT NULL,
            vector BLOB NOT NULL,
            model TEXT NOT NULL,
            UNIQUE (page_id, chunk_idx),
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_pages_zone ON pages(zone);
        CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

        CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
            path UNINDEXED,
            title,
            body_text,
            tokenize='porter unicode61'
        );
        """
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------


def embed_via_openrouter(texts: list[str], api_key: str) -> list[list[float]] | None:
    """POST to OpenRouter embeddings endpoint. Returns list of vectors or None on failure."""
    body = json.dumps({"model": EMBED_MODEL, "input": texts}).encode("utf-8")
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
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.load(resp)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as err:
        log(f"embedding API error: {err}")
        return None
    return [item["embedding"] for item in data.get("data", [])]


def vector_to_blob(vec: list[float]) -> bytes:
    import struct
    return struct.pack(f"{len(vec)}f", *vec)


# ---------------------------------------------------------------------------
# Indexing
# ---------------------------------------------------------------------------


def walk_vault(root: Path) -> Iterable[Path]:
    skip_dirs = {"node_modules", ".obsidian", ".trash", ".next", "__pycache__"}
    for p in root.rglob("*.md"):
        if any(part in skip_dirs or part.startswith(".") for part in p.relative_to(root).parts):
            continue
        yield p


def upsert_tags(conn: sqlite3.Connection, page_id: int, tags: list[str]) -> None:
    cur = conn.cursor()
    cur.execute("DELETE FROM page_tags WHERE page_id = ?", (page_id,))
    for tag in tags:
        if not tag:
            continue
        cur.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag,))
        cur.execute("SELECT id FROM tags WHERE name = ?", (tag,))
        row = cur.fetchone()
        if row:
            cur.execute(
                "INSERT OR IGNORE INTO page_tags (page_id, tag_id) VALUES (?, ?)",
                (page_id, row[0]),
            )


def upsert_pointers(conn: sqlite3.Connection, from_path: str, body: str) -> None:
    """Extract [[wikilinks]] from body and store as pointers."""
    cur = conn.cursor()
    cur.execute("DELETE FROM pointers WHERE from_path = ?", (from_path,))
    seen = set()
    for match in re.finditer(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", body):
        target = match.group(1).strip()
        if not target.endswith(".md"):
            target += ".md"
        # heuristic: link targets resolve into wiki/ unless already prefixed
        if not target.startswith(("wiki/", "sources/", "journal/", "schema/")):
            target = f"wiki/{target}"
        key = (from_path, target, "wikilink")
        if key in seen:
            continue
        seen.add(key)
        cur.execute(
            "INSERT OR IGNORE INTO pointers (from_path, to_path, kind) VALUES (?, ?, 'wikilink')",
            (from_path, target),
        )


def index_file(
    conn: sqlite3.Connection,
    root: Path,
    path: Path,
    api_key: str | None,
    force: bool,
) -> str:
    """Returns one of: 'fresh', 'updated', 'skipped'."""
    rel = path.relative_to(root)
    rel_str = str(rel).replace(os.sep, "/")
    raw = path.read_text(encoding="utf-8", errors="replace")
    fm, body = parse_frontmatter(raw)
    body_text = body
    body_hash = sha256_hex(body)

    cur = conn.cursor()
    cur.execute("SELECT id, body_hash FROM pages WHERE path = ?", (rel_str,))
    existing = cur.fetchone()
    if existing and existing[1] == body_hash and not force:
        return "skipped"

    title = fm.get("title") or path.stem
    status = fm.get("status")
    created = fm.get("created")
    updated = fm.get("updated")
    tags_field = fm.get("tags") or []
    if isinstance(tags_field, str):
        tags = [t.strip() for t in tags_field.split(",") if t.strip()]
    elif isinstance(tags_field, list):
        tags = [str(t).strip() for t in tags_field if str(t).strip()]
    else:
        tags = []
    fm_json = json.dumps(fm, default=str)

    now = time.time()
    if existing:
        page_id = existing[0]
        cur.execute(
            """UPDATE pages SET
                zone=?, title=?, status=?, created=?, updated=?,
                body_text=?, body_hash=?, frontmatter_json=?, indexed_at=?
              WHERE id=?""",
            (
                zone_of(rel),
                title,
                status,
                created,
                updated,
                body_text,
                body_hash,
                fm_json,
                now,
                page_id,
            ),
        )
        cur.execute("DELETE FROM pages_fts WHERE path = ?", (rel_str,))
        action = "updated"
    else:
        cur.execute(
            """INSERT INTO pages
                (path, zone, title, status, created, updated, body_text, body_hash, frontmatter_json, indexed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                rel_str,
                zone_of(rel),
                title,
                status,
                created,
                updated,
                body_text,
                body_hash,
                fm_json,
                now,
            ),
        )
        page_id = cur.lastrowid
        action = "fresh"

    cur.execute(
        "INSERT INTO pages_fts (path, title, body_text) VALUES (?, ?, ?)",
        (rel_str, title or "", body_text or ""),
    )

    upsert_tags(conn, page_id, tags)
    upsert_pointers(conn, rel_str, body_text)

    # Embeddings (skipped if no API key)
    if api_key:
        cur.execute("DELETE FROM vector_embeddings WHERE page_id = ?", (page_id,))
        chunks = chunk_text(body_text)
        if chunks:
            vectors = embed_via_openrouter(chunks, api_key)
            if vectors and len(vectors) == len(chunks):
                for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
                    cur.execute(
                        "INSERT INTO vector_embeddings (page_id, chunk_idx, chunk_text, vector, model) VALUES (?, ?, ?, ?, ?)",
                        (page_id, i, chunk, vector_to_blob(vec), EMBED_MODEL),
                    )

    return action


def prune_missing(conn: sqlite3.Connection, root: Path) -> int:
    cur = conn.cursor()
    cur.execute("SELECT id, path FROM pages")
    removed = 0
    for page_id, rel in cur.fetchall():
        if not (root / rel).exists():
            cur.execute("DELETE FROM pages WHERE id = ?", (page_id,))
            cur.execute("DELETE FROM pages_fts WHERE path = ?", (rel,))
            removed += 1
    return removed


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def resolve_vault(arg: str | None) -> Path:
    if arg:
        return Path(arg).expanduser().resolve()
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
    return DEFAULT_VAULT


def main() -> int:
    parser = argparse.ArgumentParser(description="Index the agentic-os vault into SQLite + FTS5 + vectors.")
    parser.add_argument("--vault", help="Vault path (default: from config / env / ~/Documents/Second Brain)")
    parser.add_argument("--no-embed", action="store_true", help="Skip vector embeddings (FTS5 only)")
    parser.add_argument("--reindex", action="store_true", help="Force reindex of every page")
    args = parser.parse_args()

    vault = resolve_vault(args.vault)
    if not vault.is_dir():
        log(f"vault not found: {vault}")
        return 2
    log(f"vault: {vault}")

    db_path = vault / "vault.db"
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    init_db(conn)

    api_key = None if args.no_embed else os.environ.get("OPENROUTER_API_KEY")
    if not args.no_embed and not api_key:
        log("no OPENROUTER_API_KEY — skipping vector embeddings (FTS5 only)")

    counts = {"fresh": 0, "updated": 0, "skipped": 0}
    for path in walk_vault(vault):
        try:
            action = index_file(conn, vault, path, api_key, args.reindex)
            counts[action] += 1
        except Exception as err:  # noqa: BLE001 — index keeps going
            log(f"error indexing {path}: {err}")

    removed = prune_missing(conn, vault)
    conn.commit()

    log(
        f"done. fresh={counts['fresh']} updated={counts['updated']} "
        f"skipped={counts['skipped']} removed={removed} db={db_path}"
    )
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
