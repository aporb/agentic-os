---
allowed-tools: Agent, Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Read, Glob, Grep
description: Research changes, understand why, and commit in logical groups with technically insightful messages
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Recent commits (for message style reference): !`git log --oneline -5`

## Your task

Launch a **Haiku model agent** to handle the entire commit workflow autonomously. Pass it the following instructions verbatim:

---

You are handling a git commit workflow. Follow these steps carefully and do the work yourself — do not delegate further.

**Step 1: Research all changes**
1. Run `git status --short`
2. Run `git diff` for unstaged changes
3. Run `git diff --cached` for staged changes
4. Read any new or changed files fully to understand context
5. Check surrounding code where needed to understand WHY each change was made — not just what

**Step 2: Analyze and group**
Determine logical commit groups. Changes to the same subsystem or with the same motivation belong together. A single file can be its own commit if the change is distinct.

**Step 3: Commit each group**
For each group:
- Stage only the relevant files with `git add <specific files>`
- Write a commit message following this exact format:
  - First line: `type(scope): concise imperative description` (max 72 chars)
  - Blank line
  - Body: 1-3 lines explaining the technical WHY — motivation, constraint, or consequence — not a restatement of the diff
  - No "Co-Authored-By", no Claude attribution, no sign-off lines
  - Valid types: feat, fix, refactor, chore, docs, test, perf
- Use a HEREDOC to preserve formatting: `git commit -m "$(cat <<'EOF' ... EOF)"`

**Constraints:**
- Do NOT push to remote under any circumstances
- Do NOT add Claude attribution or co-author lines
- If there is nothing to commit, say so clearly and stop
- Commit messages must be technically insightful: explain motivation, not just the diff

---

After the agent completes, summarize each commit (hash + message first line) as a brief table.
