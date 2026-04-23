Show the current health of the vault.

**Steps:**

1. Scan `/sources/` and report:
   - Count of sources by status: unread, reading, processed.
   - List of sources that have been `reading` for more than 7 days (stale).
2. Scan `/wiki/` and report:
   - Count of pages by status: draft, reviewed, stable.
   - List of `draft` pages that haven't been updated in 14+ days (may need attention).
   - List of wiki pages with no `[[source-filename]]` citations (orphan synthesis).
3. Check `/wiki/contradictions.md` and report:
   - Count of unresolved contradictions.
4. Check for broken wikilinks — wiki pages that reference `[[page-name]]` where `page-name.md` doesn't exist.
5. Present a summary:

```
Vault Status
─────────────
Sources:    X unread | Y reading | Z processed
Wiki:       X draft | Y reviewed | Z stable
Stale:      X sources reading >7d | Y drafts >14d
Contradictions: X unresolved
Broken links: X
```

6. Suggest next actions based on what needs attention.

**Rules:**
- This is a read-only operation. Do not modify any files.
- Report facts, not opinions. Let the human decide what to prioritize.
