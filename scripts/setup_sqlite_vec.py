#!/usr/bin/env python3
"""
Set up sqlite-vec native vector search on top of an existing vault.db.

Reads from the legacy `vector_embeddings` table (written by index_vault.py)
and mirrors every chunk into a `vec_pages` vec0 virtual table so that
search can use native sqlite-vec distance ops instead of Python cosine.

Idempotent: re-running drops + recreates `vec_pages` from current
`vector_embeddings` content. Cheap on small DBs (< few thousand chunks).

Usage:
    python3 scripts/setup_sqlite_vec.py --vault PATH

Env:
    AGENTIC_OS_VAULT — default vault path if --vault omitted
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
import time
from pathlib import Path

import sqlite_vec


def detect_dim(db: sqlite3.Connection) -> int:
    """Read one vector blob to determine the embedding dimensionality."""
    row = db.execute(
        "SELECT length(vector) FROM vector_embeddings WHERE vector IS NOT NULL LIMIT 1"
    ).fetchone()
    if not row:
        sys.exit("[setup-vec] vector_embeddings is empty — run index_vault.py first")
    bytes_per = row[0]
    if bytes_per % 4 != 0:
        sys.exit(f"[setup-vec] unexpected blob size {bytes_per} (not float32-aligned)")
    return bytes_per // 4


def main() -> int:
    ap = argparse.ArgumentParser(description="Mirror vector_embeddings → sqlite-vec vec0")
    ap.add_argument("--vault", help="Vault path (default from AGENTIC_OS_VAULT)")
    args = ap.parse_args()

    vault_path = Path(args.vault or os.environ.get("AGENTIC_OS_VAULT") or "").expanduser().resolve()
    db_path = vault_path / "vault.db"
    if not db_path.exists():
        sys.exit(f"[setup-vec] no vault.db at {db_path}")

    db = sqlite3.connect(str(db_path))
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)

    vec_version = db.execute("SELECT vec_version()").fetchone()[0]
    dim = detect_dim(db)
    legacy_count = db.execute("SELECT COUNT(*) FROM vector_embeddings").fetchone()[0]
    print(f"[setup-vec] db={db_path}  sqlite-vec={vec_version}  dim={dim}  legacy_chunks={legacy_count}")

    # Drop existing vec_pages if any (idempotent) and recreate
    db.execute("DROP TABLE IF EXISTS vec_pages")
    db.execute(f"""
        CREATE VIRTUAL TABLE vec_pages USING vec0(
            chunk_id INTEGER PRIMARY KEY,
            page_id INTEGER,
            chunk_idx INTEGER,
            embedding float[{dim}]
        )
    """)

    # Migrate every chunk from vector_embeddings → vec_pages
    t0 = time.time()
    n = 0
    cur = db.execute("SELECT id, page_id, chunk_idx, vector FROM vector_embeddings")
    for chunk_id, page_id, chunk_idx, vec_blob in cur:
        db.execute(
            "INSERT INTO vec_pages(chunk_id, page_id, chunk_idx, embedding) VALUES (?, ?, ?, ?)",
            (chunk_id, page_id, chunk_idx, vec_blob),
        )
        n += 1
    db.commit()
    elapsed = time.time() - t0
    print(f"[setup-vec] mirrored {n} chunks → vec_pages in {elapsed:.2f}s")

    # Sanity check: try a self-query
    sample = db.execute("SELECT vector FROM vector_embeddings LIMIT 1").fetchone()
    if sample:
        match = db.execute(
            "SELECT chunk_id, distance FROM vec_pages WHERE embedding MATCH ? AND k=3 ORDER BY distance"
        , [sample[0]]).fetchall()
        print(f"[setup-vec] self-query sanity: top match chunk_id={match[0][0]}, distance={match[0][1]:.4f} (should be ~0)")

    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
