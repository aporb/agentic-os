---
name: proposal-draft
description: Draft a scoped proposal or SOW from deal notes and requirements — priced, structured, and ready for review before sending.
version: 1.0.0
trigger:
  - "draft a proposal for"
  - "write a proposal"
  - "create a SOW for"
  - "proposal for this deal"
  - "scope this engagement"
  - "write up the proposal for"
  - "put together a proposal"
  - "draft SOW for"
inputs:
  - name: deal_name
    description: Company name or deal slug — used to pull the prospect intel card and call prep notes
    required: true
  - name: scope_notes
    description: What the engagement actually covers — deliverables, outcomes, constraints. Can be rough notes from the discovery call.
    required: true
  - name: pricing
    description: Your pricing structure for this deal — fixed fee, retainer, usage-based, milestone-based. Include numbers if you have them; leave open if still TBD.
    required: true
  - name: timeline
    description: Target start date, duration, and any hard deadlines
    required: false
  - name: your_company_name
    description: Your business name for the proposal header
    required: false
output_artifact: Google Doc (proposal-{slug}-v1)
frequency: on-demand
pack: cro
---

## When to run

Run after a discovery call or demo has produced enough signal to scope the work. You need at minimum: a clear problem to solve, the deliverables the prospect expects, and your pricing structure. Everything else can be approximate.

Run this before any verbal agreement is made. The proposal is not just a quote — it's the first written record of what both sides are agreeing to. Scope creep starts with vague proposals. This skill produces a proposal specific enough that both sides understand what they're buying.

## What you'll get

A Google Doc created via Google Drive MCP with a complete proposal structure — cover page, executive summary, scope of work, timeline, pricing table, terms, and next steps. The document is named `proposal-{slug}-v1` and saved to your Google Drive.

The skill also appends an entry to `wiki/prospect-{slug}.md` Activity Log recording that the proposal was created, the version number, and the Google Doc link.

## Steps

1. **Load deal context.** Query `vault.db` for:
   - `wiki/prospect-{slug}.md` — company context, deal history, open questions
   - `journal/*-call-prep-{slug}.md` (most recent) — what was discussed, what the prospect said they cared about, any stated constraints
   If no intel card exists, proceed with the manually provided `scope_notes` and flag the gap.

2. **Synthesize the problem statement.** From call notes and intel card, write 2–3 sentences that state the prospect's problem in their own language — the way they described it, not the way you would pitch it. This becomes the executive summary opening. If you're framing the problem in a way the prospect wouldn't recognize, rewrite it.

3. **Define scope of work.** Break `scope_notes` into discrete deliverables. For each deliverable:
   - Name it concretely (not "support" — "weekly 1-hour check-in calls for 8 weeks")
   - State what's included and what's not (out-of-scope)
   - Assign it to a phase or milestone if the engagement has phases
   Hard rule: if something is not named in the scope, it's not in scope. "And other tasks as needed" language gets removed.

4. **Build pricing table.** Structure the pricing from `pricing` input:
   - If fixed fee: total, payment schedule (e.g., 50% on signing, 50% on delivery)
   - If retainer: monthly rate, hours or deliverables included, overage policy
   - If milestone-based: one row per milestone with the deliverable and amount
   - If pricing is TBD: leave a `[TBD]` placeholder with a note in the document for the sender to fill before sending
   Do not guess at pricing. If numbers aren't provided, placeholder them.

5. **Write timeline.** If `timeline` was provided: map start date, milestones, and end date. If not: write a template timeline with `[DATE]` placeholders. Include: kickoff date, first major milestone, final delivery, and any hard dependencies.

6. **Write terms section.** Standard minimal terms:
   - Payment terms (net 15 / net 30 on invoices)
   - Revision policy (number of rounds included)
   - Intellectual property (work product belongs to client on full payment)
   - Termination (30-day written notice, work completed to date is billed)
   These are starting-point terms, not legal advice. Flag clearly in the document: "Review with your attorney before sending."

7. **Write next steps.** One short section at the end: "To move forward, sign and return this proposal by {date}. A deposit of {amount} initiates the engagement. Contact {name} at {email} with questions." Leave placeholders where dates and amounts aren't known.

8. **Create Google Doc.** Use Google Drive MCP to create the document in Google Drive root (or a `Proposals/` folder if it exists). Name it `proposal-{slug}-v1`. Apply Heading 1/2/3 formatting. Return the document URL.

9. **Update intel card.** Append to `wiki/prospect-{slug}.md` Activity Log:
   ```
   - {YYYY-MM-DD}: Proposal v1 drafted. Google Doc: {url}. Deal stage: proposal-sent (pending).
   ```

10. **Confirmation.** Return a summary: key scope items, total price, timeline anchor dates, and the Google Doc link. Note any `[TBD]` placeholders that need filling before the document is sent.

## Output format

The Google Doc follows this structure:

```
[Your Company Name]

PROPOSAL FOR: [Prospect Company]
Prepared by: [Your Name]
Date: {YYYY-MM-DD}
Version: 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

{2–3 sentences: the problem, the proposed solution, the expected outcome}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCOPE OF WORK

Phase 1: {Phase Name}
  Deliverable 1.1: {Concrete name}
    - Included: {what's in}
    - Out of scope: {what's not}

Phase 2: ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIMELINE

| Milestone | Target Date |
|-----------|-------------|
| Kickoff | {date} |
| {Milestone 1} | {date} |
| Final delivery | {date} |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVESTMENT

| Item | Amount |
|------|--------|
| {Deliverable or phase} | ${amount} |
| Total | ${total} |

Payment schedule: {schedule}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMS

{Payment terms, revision policy, IP ownership, termination clause}
⚠ Review with your attorney before sending.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS

{Sign and return instructions, deposit amount, contact info}
```

## Example output

```
CONFIRMATION

Google Doc created: proposal-meridian-logistics-v1
URL: https://docs.google.com/document/d/[id]

Scope summary:
  - 8-week dispatch optimization engagement
  - Deliverables: audit (week 1–2), configuration (week 3–5), pilot (week 6–7), handoff (week 8)
  - Out of scope: TMS vendor migration, carrier onboarding

Pricing: $18,000 fixed fee — $9,000 on signing, $9,000 on delivery

Timeline: Start [TBD], target delivery 8 weeks from kickoff

Placeholders to fill before sending:
  - [TBD]: Your company name (top of document)
  - [TBD]: Start date
  - [DATE]: Next steps signature deadline

Intel card updated: wiki/prospect-meridian-logistics.md
```
