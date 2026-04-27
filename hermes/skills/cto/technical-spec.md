---
name: technical-spec
description: Turn a feature idea into a complete implementation plan — ready to hand to OpenCode or a contractor without a follow-up conversation.
version: 1.0.0
trigger:
  - "write a technical spec"
  - "write a spec for"
  - "spec out this feature"
  - "create a technical spec"
  - "implementation plan for"
  - "spec ready for OpenCode"
  - "write the spec"
  - "technical requirements for"
  - "generate a spec"
  - "build spec for"
integrations:
  - vault-sqlite-fts5
  - bash-git
inputs:
  - name: feature_name
    description: Name of the feature or task to spec
    required: true
  - name: spec_source
    description: Any existing notes, PRD, user story, or rough description — paste inline or reference a wiki page (optional; skill will search vault if omitted)
    required: false
  - name: project_path
    description: Absolute path to the project root (defaults to current working directory)
    required: false
output_artifact: "spec.md"
frequency: on-demand
pack: cto
---

# Technical Spec

## When to run

When you have a feature to build and need to translate intent into a document that another agent or contractor can execute without asking you ten clarifying questions. Run this before handing anything to OpenCode, before creating a Linear ticket that will go to a developer, or before starting a coding block yourself — the act of speccing forces you to find the edge cases you hadn't considered.

The spec lives at `spec.md` in the project root. OpenCode and most coding agents look for it there by convention.

## What you'll get

A structured `spec.md` that covers: what to build, why, the exact acceptance criteria, the data model and API contract, edge cases, what not to build, and a suggested implementation order. A contractor handed this file can estimate the work and start without a kickoff call. OpenCode can execute from it directly.

## Steps

1. Search the vault for existing context: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 25) FROM pages WHERE pages MATCH '<feature_name>' LIMIT 8;"`. Look for prior specs, ADRs, wiki pages, or Linear ticket exports that mention this feature.

2. If `project_path` is provided, read the current directory structure: `find <project_path>/src -type f -name "*.ts" -o -name "*.tsx" -o -name "*.py" | head -60`. Understand the existing codebase shape — file naming conventions, directory structure, existing patterns.

3. Read relevant existing files to understand conventions: check `<project_path>/package.json` or `<project_path>/pyproject.toml` for the stack, and read 2–3 representative source files to understand coding patterns.

4. If `spec_source` is provided, use it as the primary input. Extract: the user-facing goal, any constraints mentioned, any data mentioned, any integration points mentioned.

5. Draft the spec. Apply strict BLUF discipline: the first paragraph states exactly what the feature does and what done looks like. No background preamble.

6. Resolve ambiguities by making explicit, reasoned decisions rather than leaving blanks. State each decision and the rationale in one sentence. Example: "Using optimistic UI updates here — latency on this endpoint is predictable and the write failure rate is below 0.5%." A contractor or agent needs decisions, not questions.

7. Write acceptance criteria as numbered, testable assertions. Each criterion maps to exactly one observable behavior. Avoid compound criteria.

8. Include a "What this spec does not cover" section — scope boundaries prevent scope creep when handing off to any implementer.

9. Save to `spec.md` in `<project_path>` (or current working directory if not specified). Overwrite if it exists — always reflect the current intent.

10. Print a one-line summary: "spec.md written — [feature_name], [N] acceptance criteria, ready for OpenCode or contractor."

## Output format

```markdown
---
feature: "[Feature Name]"
created: YYYY-MM-DD
status: ready-for-implementation
stack: "[detected or provided tech stack]"
estimated_complexity: "[S / M / L — based on scope]"
---

# Spec: [Feature Name]

[One paragraph. What this builds. Who it serves. What done looks like.]

## Context

[2–4 sentences maximum. Why this feature exists. What problem it solves.
What happens if it is not built. No history, no background narrative.]

## Acceptance Criteria

1. [Behavior observable from the outside. Testable. Single condition.]
2. [...]
3. [...]
(5–10 criteria for a standard feature)

## Data Model

[Table or code block describing any new or modified database schema, types, or interfaces.]

```typescript
interface FeatureName {
  id: string;
  // ...
}
```

## API / Interface Contract

[Endpoint paths, request/response shapes, or function signatures depending on the stack.]

```
POST /api/[resource]
Body: { field: type, ... }
Response: { id: string, ... }
```

## Implementation Order

1. [First thing to build — usually the data layer or migration]
2. [Second — server logic or business rules]
3. [Third — API surface]
4. [Fourth — UI or client layer]
5. [Fifth — tests]

## Edge Cases

- [What happens when X is null / empty / missing]
- [Concurrent request handling]
- [Auth edge: unauthenticated user attempts this action]
- [Rate limiting / abuse surface if applicable]

## What This Spec Does Not Cover

- [Explicitly named out-of-scope items — prevents scope creep]

## Open Questions

- [If genuinely unresolved, list here. Otherwise leave this section empty and delete it.]
```

## Example output (truncated)

```markdown
---
feature: "User-defined webhook notifications"
created: 2026-04-26
status: ready-for-implementation
stack: "Next.js 15 / Supabase / TypeScript"
estimated_complexity: M
---

# Spec: User-defined Webhook Notifications

Users can register a HTTPS endpoint to receive a POST payload whenever a skill completes a run. This replaces the current Telegram-only delivery mechanism with a general push integration point.

## Context

Three beta users have asked to pipe skill output into their own tools (Notion, Make, Slack). Telegram delivery is useful but creates a hard dependency on the Telegram bot. A webhook endpoint lets any downstream system subscribe to skill completions without requiring changes to Hermes.

## Acceptance Criteria

1. A user can register up to 5 webhook URLs per account via the settings UI.
2. Each registered URL receives a POST within 5 seconds of a skill run completing.
3. The POST body is JSON: `{ skill, status, output_path, timestamp, run_id }`.
4. Failed deliveries (non-2xx or timeout) retry 3 times with exponential backoff.
5. A webhook that fails 10 consecutive deliveries is automatically disabled and the user is notified.
6. The user can test a webhook URL with a synthetic payload from the settings UI.
7. Webhook secrets (HMAC-SHA256 header) are supported and validated on round-trip test.

## Data Model

```typescript
interface Webhook {
  id: string;
  user_id: string;
  url: string;
  secret?: string;
  enabled: boolean;
  failure_count: number;
  created_at: string;
}
```

## What This Spec Does Not Cover

- Filtering by skill name (all completed skills trigger all webhooks — v2 concern)
- Webhook event history UI (log table is a separate spec)
```
