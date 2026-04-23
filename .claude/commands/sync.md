Sync the vault with the remote repository.

**Steps:**

1. Run `git pull --rebase` to get any remote changes.
2. If there are conflicts, report them to the user and stop. Do not auto-resolve.
3. Run `git add -A` to stage all changes.
4. If there are staged changes:
   - Generate a commit message based on what changed:
     - New source files: `ingest: {filename}`
     - New/updated wiki pages: `wiki: {pagename}`
     - Journal entries: `journal: YYYY-MM-DD`
     - Schema changes: `schema: {description}`
     - Mixed changes: `update: {brief description}`
   - Run `git commit -m "{message}"`.
5. Run `git push origin main` (or the current branch).
6. Report the result to the user.

**Rules:**
- Never force push.
- Never auto-resolve merge conflicts.
- Commit message should describe what changed, not just "update" or "sync".
