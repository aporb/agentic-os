---
name: case-study-draft
description: Draft a publishable customer case study from a win or client call notes — structured story from problem through result.
version: 1.0.0
trigger:
  - "write a case study"
  - "draft a case study"
  - "case study for"
  - "customer story for"
  - "write up the win with"
  - "document the result with"
  - "client success story"
  - "write up what happened with"
integrations:
  - vault-sqlite-fts5
  - google-drive-read
inputs:
  - name: customer_name
    description: The customer or company name (will be used in the artifact slug and title)
    required: true
  - name: outcome_summary
    description: One or two sentences describing the result — what changed, what the customer achieved, what the measurable outcome was
    required: true
  - name: source_notes
    description: Optional Google Drive file link to a call transcript, Loom transcript, or notes doc, or a vault wiki page slug with raw notes
    required: false
  - name: anonymize
    description: "Whether to anonymize the customer name in the published draft — 'yes' replaces name with a descriptor like 'a B2B SaaS founder'. Default: no"
    required: false
output_artifact: "wiki/case-study-[customer-slug].md"
frequency: on-demand
pack: cmo
---

## When to run

Within 48 hours of a customer win, a strong success story from a client call, or a result worth documenting. The longer you wait, the less specific the story gets. Run it when the detail is still fresh, even if you don't have a call transcript — feed the outcome summary and your own notes, and the skill shapes them into a publishable structure.

Run it with a call transcript if you have one stored in Google Drive. A good transcript turns a generic success story into a specific one, and specificity is what separates a case study that generates leads from one that sits in a wiki page nobody reads.

## What you'll get

A publish-ready case study draft saved to `wiki/case-study-[customer-slug].md`. The structure follows a standard problem-approach-result arc, written in the third person but grounded in specific detail. The draft is factual, concrete, and short. Aim for 500–800 words. Long case studies don't get read.

The draft enforces the same anti-AI-voice rules as blog posts. No corporate verbs. No em-dashes. No vague claims of "transformation" or "efficiency gains." Every claim is specific or it gets cut.

## Steps

1. Parse the inputs. If `anonymize` is "yes," determine the descriptor to use in place of the customer name — derive it from any context available (industry, role, company size). Example: "a $600K ARR B2B data founder" is more useful than "a software company." Apply the anonymization consistently throughout the draft.

2. Search the vault for any existing notes on this customer: `sqlite3 vault.db "SELECT path, title FROM pages WHERE pages MATCH '<customer_name>' ORDER BY rank LIMIT 10;"`. Read any relevant pages — prospect research notes, win/loss debriefs, meeting prep notes, prior email drafts. These surface context that should be in the case study.

3. If `source_notes` is provided as a Google Drive link, read the file via Google Drive MCP. This is typically a call transcript (Loom export, Zoom transcript, or manual notes). Extract:
   - The customer's description of the problem in their own words — verbatim quotes where usable
   - The specific state before they used your product or service
   - The specific state after — numbers, timeframes, qualitative changes they name
   - Any friction points they mention (these make the story credible)
   - Any specific language they use about the experience — this feeds the quote section

4. If `source_notes` is a vault wiki page slug, read that page in full and apply the same extraction.

5. If no `source_notes` are provided, work entirely from the `outcome_summary` and vault context. The result will be less specific — flag this in the draft with a comment asking the user to add specific numbers or a quote before publishing.

6. Build the case study structure:
   - **Header:** company/customer descriptor, industry, outcome in one line (e.g. "From 4 newsletter issues per year to weekly publishing — without adding hours.")
   - **The situation:** 2–3 sentences describing who the customer is and what they were dealing with before. Specific: their stage, their problem, what they'd tried. No "like many businesses" generics.
   - **The problem in their own words:** a direct quote from the transcript or notes, if available. If no quote exists, flag the gap. A good quote here doubles the credibility of everything that follows.
   - **The approach:** what they did. Specific actions, tools, or methods. 3–5 sentences. Do not say "they implemented a solution." Say what they actually did.
   - **The result:** the outcome in specific terms. Numbers where available: time saved, revenue added, conversion rate changed, churn reduced. If numbers aren't available, state qualitative changes in specific terms — not "improved significantly" but "went from one piece of content per month to one per week."
   - **In their words (second quote):** a closing quote from the customer about the result or the experience, if available from the transcript. If not available, flag the gap.
   - **What this means for similar founders:** 2–3 sentences generalizing the implication. What does this result suggest for someone in a similar position? This is the CTA-adjacent section — it makes the case study useful to the reader, not just flattering to the customer.

7. Apply anti-AI-voice rules throughout the draft:
   - No em-dashes. Use commas and periods.
   - No hedging: "perhaps," "might," "could help," "it seems," "we believe."
   - No corporate jargon: "leverage" (verb), "synergy," "transformation," "journey," "deep dive," "ecosystem," "scalable."
   - No vague impact claims: "significantly improved," "dramatically increased," "major gains." Every claim is a specific number or a specific qualitative change.
   - No "In conclusion" or summary paragraph that just repeats what was already said.
   - Short sentences. Active voice. Third person throughout except in direct quotes.
   - Each paragraph earns its place. If removing it changes nothing, remove it.

8. Add a one-line metadata summary at the top of the draft (above the narrative) with: customer type, industry, the problem solved, and the key result. This is for internal use — the reader of the wiki page can get the gist in 10 seconds without reading the full draft.

9. Flag gaps for the user in a "Before publishing" section at the bottom of the draft. Common gaps: missing customer quote, missing specific numbers, customer approval pending, anonymization decision not confirmed. The user must clear the flags before publishing.

10. Save to `wiki/case-study-[customer-slug].md` with `status: draft`.

## Output format

```yaml
---
type: wiki
title: "Case Study — [Customer Name or Descriptor]"
created: YYYY-MM-DDT00:00:00
updated: YYYY-MM-DDT00:00:00
status: draft
tags: [case-study, cmo, <industry-tag>]
sources: [<vault-pages-cited>, <google-drive-file-if-used>]
customer: <customer-name-or-anonymized-descriptor>
outcome: <one-line outcome summary>
anonymized: yes|no
---
```

```markdown
# Case Study — [Customer Name or Descriptor]

**Customer:** [name or descriptor]
**Industry:** [industry]
**Problem solved:** [one line]
**Key result:** [specific outcome in one line]

---

## The Situation

[2–3 sentences. Who the customer is, what stage they were at, what they were dealing with.]

## The Problem

[2–3 sentences grounding the specific challenge. Include a direct customer quote if available.]

> "[Verbatim customer quote from transcript or notes]"

## The Approach

[3–5 sentences. What they actually did. Specific actions, tools, methods. No vague "implemented a solution."]

## The Result

[The outcome in specific terms. Numbers where available. Qualitative specifics where numbers aren't.]

> "[Closing customer quote, if available]"

## What This Means for Similar Founders

[2–3 sentences generalizing the implication for the reader.]

---

## Before publishing

- [ ] Customer has reviewed and approved this draft
- [ ] Confirm anonymization decision: [yes / no]
- [ ] [Flag any missing numbers or quotes here]
```

## Example output (truncated)

```markdown
---
type: wiki
title: "Case Study — Meridian Analytics"
created: 2026-04-28T11:00:00
status: draft
tags: [case-study, cmo, b2b-saas, content-ops]
customer: Meridian Analytics
outcome: "Went from quarterly newsletter to weekly publishing — no additional hours"
anonymized: no
---

# Case Study — Meridian Analytics

**Customer:** Meridian Analytics
**Industry:** B2B data infrastructure, $450K ARR
**Problem solved:** Content published too rarely to compound as a lead source
**Key result:** Weekly newsletter cadence achieved; first consistent content calendar in 3 years

---

## The Situation

Meridian Analytics had a clear product and a technical audience that responded well
when they did publish. The problem was frequency. In the 12 months before working
with agentic-os, they shipped four pieces of content. Not because they lacked ideas,
but because every piece required rebuilding context from scratch.

## The Problem

The founder, Tariq, described it this way in a call in March 2026:

> "Every time I sat down to write, the first 45 minutes were me figuring out
> what I'd already said, who the piece was for, and whether it fit anything else
> I'd been working on. By the time I had the context, my writing window was half
> gone."

## The Approach

Tariq ran the `content-calendar` skill at the start of April and mapped 4 weeks
of newsletter and LinkedIn content against two specific goals: reaching technical
founders evaluating data infrastructure, and positioning Meridian as the team
that understands the operational side of data pipelines, not just the tooling.
```
