---
name: architecture-decision-record
description: Document a technical decision in ADR format — context, the decision, consequences, and alternatives considered.
version: 1.0.0
trigger:
  - "write an ADR"
  - "architecture decision record"
  - "document this decision"
  - "record this architecture decision"
  - "create an ADR"
  - "document why we chose"
  - "decision record"
  - "adr for"
  - "document the technical decision"
  - "record why we"
integrations:
  - vault-sqlite-fts5
inputs:
  - name: decision_topic
    description: The architectural question or decision being recorded (e.g. "database choice", "auth strategy", "message queue selection")
    required: true
  - name: chosen_approach
    description: What was decided — the technology, pattern, or direction selected
    required: true
  - name: context_notes
    description: Background, constraints, or reasoning to include — paste notes or reference a wiki page (optional)
    required: false
output_artifact: "wiki/adr-[slug].md"
frequency: on-demand
pack: cto
---

# Architecture Decision Record

## When to run

Every time you make a technical decision that will be expensive to reverse. That's the bar — not every decision gets an ADR, only the ones where you'd need to explain the reasoning to a new engineer six months from now before they could safely work in the affected area.

Typical triggers: choosing a database, picking an auth strategy, deciding how to structure an API (REST vs. GraphQL vs. tRPC), committing to a message queue or event system, choosing a deployment platform, deciding between building and buying a capability.

Write the ADR at decision time, not after. Writing it after trades the hard thinking for a retrospective narrative, which is less useful.

## What you'll get

A `wiki/adr-[slug].md` that explains what was decided, why the alternatives were rejected, and what the consequences (positive and negative) of the decision are. The ADR persists in the vault and can be referenced in future decisions — so technical debt and path dependencies become visible over time instead of compounding invisibly.

## Steps

1. Search the vault for any prior ADRs on related topics: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/adr-%' ORDER BY created DESC LIMIT 10;"`. List the existing ADRs — a new decision may supersede a prior one, in which case the old ADR should reference the new one.

2. Search the vault for any context that's relevant to this decision: `sqlite3 vault.db "SELECT path, snippet(pages, 0, '', '', '...', 20) FROM pages WHERE pages MATCH '<decision_topic>' LIMIT 5;"`. Prior specs, postmortems, or meeting notes may contain constraints or lessons that belong in the ADR.

3. Determine the ADR number. Count existing ADRs: `sqlite3 vault.db "SELECT COUNT(*) FROM pages WHERE path LIKE 'wiki/adr-%';"`. The new ADR gets number N+1 as a sequence (e.g. ADR-007). The slug is the decision topic in kebab-case.

4. Draft the ADR. The five mandatory sections are: Status, Context, Decision, Consequences, and Alternatives Considered. Each section has a specific job — do not collapse them.

   - **Status** is one word: Proposed, Accepted, Deprecated, or Superseded.
   - **Context** states the situation and constraints that made a decision necessary. It is neutral — it does not argue for the chosen approach. Max 5 sentences.
   - **Decision** states what was chosen, in one clear sentence. Then explains the reasoning. The reasoning must be grounded in the constraints from Context — do not introduce new reasoning here that wasn't in Context.
   - **Consequences** is a two-column honest accounting: what gets better as a result of this decision, and what gets harder or more constrained. Both must be populated.
   - **Alternatives Considered** names each rejected option and explains in one or two sentences why it was rejected. Vague rejections ("didn't seem right") are not acceptable — the rejection must be grounded in the constraints.

5. If `context_notes` are provided, extract the relevant constraints and incorporate them into the Context section. Do not paste notes verbatim — synthesize them.

6. If this ADR supersedes an existing one, note the superseded ADR's path in the frontmatter and add a reference to it in the Status section.

7. Write to `wiki/adr-<slug>.md`. Do not overwrite an existing ADR — if the decision is being revised, create a new ADR and mark the old one as Superseded.

8. Confirm: "ADR-[number] written to wiki/adr-[slug].md — status: [status]."

## Output format

```markdown
---
type: wiki
title: "ADR-[NNN]: [Decision Topic]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [proposed | accepted | deprecated | superseded]
tags: [adr, cto, architecture]
adr_number: NNN
decision_topic: "[topic]"
supersedes: "[path to prior ADR if applicable]"
superseded_by: ""
---

# ADR-[NNN]: [Decision Topic]

## Status

[Accepted] — YYYY-MM-DD

[If superseded: "Superseded by [ADR-NNN: Title](wiki/adr-[slug].md)."]

## Context

[The situation. The constraints that forced a decision. What breaks or stays uncertain
if no decision is made. No advocacy for the chosen approach — just the facts that
shaped the decision space. Maximum 5 sentences.]

## Decision

[One sentence stating exactly what was decided.]

[2–4 paragraphs explaining why. Each paragraph addresses a specific constraint from
the Context section. The reasoning is grounded, not aspirational.]

## Consequences

### Positive

- [Specific thing that gets better]
- [...]

### Negative / Trade-offs

- [Specific thing that gets harder, more expensive, or more constrained]
- [...]

### Neutral / Watch Items

- [Things to monitor that are neither clearly positive nor negative yet]

## Alternatives Considered

### [Alternative A]

[One sentence description.] Rejected because: [specific constraint from Context that
this alternative fails to satisfy].

### [Alternative B]

[One sentence description.] Rejected because: [...]

### [Alternative C — "do nothing"]

Always include the "don't decide now" option and explain why it was rejected.
```

## Example output (truncated)

```markdown
# ADR-004: Authentication Strategy — JWT with Supabase Auth vs. Custom Session Cookies

## Status

Accepted — 2026-04-26

## Context

The app needs authenticated access to user-specific skill runs, vault data, and
settings. The stack is Next.js 15 with App Router. We have two contractors who
will touch auth-adjacent code; any auth approach must be legible without deep
explanation. We have no dedicated security engineer to audit a custom implementation.
The app stores no PII beyond email — compliance scope is minimal at this stage.

## Decision

We use Supabase Auth with JWT tokens, managed via Supabase's `@supabase/ssr`
package for Next.js cookie handling.

Supabase Auth handles token issuance, refresh, and revocation. The `@supabase/ssr`
package handles the Next.js middleware integration and cookie management correctly
for App Router. A custom session cookie implementation at our scale and team size
carries unacceptable audit risk — we have no one to review it.

## Consequences

### Positive

- Auth is handled by a maintained library with known security properties.
- Contractors can onboard to Supabase Auth documentation without bespoke explanation.
- Row-level security in Supabase database can reference `auth.uid()` directly.

### Negative / Trade-offs

- We accept Supabase as an auth vendor dependency. Migrating away later requires
  re-implementing token management.
- JWT expiry and refresh behavior is controlled by Supabase defaults — custom
  session lifetime requires Supabase dashboard config, not code.

## Alternatives Considered

### Custom session cookies with `iron-session`

Production-quality but requires our own token invalidation, refresh logic,
and security audit. Rejected: no engineer on the team with the depth to own this
and no budget for an external audit.

### NextAuth.js (Auth.js v5)

Mature library with many providers. Rejected: configuration complexity for our
specific Supabase + App Router setup requires a non-trivial adapter, and the
Supabase integration is better supported natively via `@supabase/ssr`.
```
