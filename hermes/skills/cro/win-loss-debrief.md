---
name: win-loss-debrief
description: Structured analysis of a deal that closed or died — what happened, why, what to carry forward, and what to change.
version: 1.0.0
trigger:
  - "win loss debrief for"
  - "debrief on this deal"
  - "deal closed — analyze it"
  - "deal died — what happened"
  - "post-mortem on this deal"
  - "why did we lose"
  - "why did we win"
  - "analyze this closed deal"
inputs:
  - name: deal_name
    description: Company name or deal slug matching an existing wiki/prospect-{slug}.md
    required: true
  - name: outcome
    description: "closed-won, closed-lost, or ghosted (prospect went dark with no decision)"
    required: true
  - name: notes
    description: Any additional context about why it closed or died — what the prospect said, what the deciding factor was, any post-decision conversation
    required: false
  - name: deal_value
    description: Final deal value if closed-won, or estimated value if lost/ghosted — used for pipeline pattern analysis over time
    required: false
output_artifact: wiki/win-loss-{deal-slug}.md
frequency: on-demand
pack: cro
---

## When to run

Run within 48 hours of a deal closing or dying. The sooner you run it, the more accurate the analysis — memory of the real reasons fades quickly and gets replaced by the story you want to tell yourself.

Run it for every deal, not just the big ones or the ones that hurt. Pattern recognition across wins and losses is only useful if you have enough data. A debrief that takes 10 minutes to run compounds into an ICP refinement that saves months of wasted outreach.

The output feeds directly into `icp-refinement` (v1+) — when you have 5+ win-loss debriefs in the vault, that skill can identify patterns across them.

## What you'll get

A wiki page saved to `wiki/win-loss-{deal-slug}.md` with:

- Deal timeline (reconstructed from the intel card and call notes)
- Outcome and the stated reason (what the prospect said)
- Actual contributing factors (what the evidence suggests was really driving it)
- What worked in this deal
- What didn't work
- What to change in the process or pitch going forward
- ICP signal: does this deal update your picture of who is and isn't a good fit?

This is not a blame document. It is a signal document. Wins contain false positives (you won for the wrong reasons). Losses contain real intelligence (the prospect told you something about your product or pitch that is worth knowing).

## Steps

1. **Load full deal history.** Query `vault.db` for:
   - `wiki/prospect-{slug}.md` — full intel card including all activity log entries
   - `journal/*-call-prep-{slug}.md` — all call prep notes in chronological order
   - Any other journal entries referencing this deal slug
   Reconstruct the deal timeline from the Activity Log entries. If the history is sparse (few notes), flag this as a process gap and note it in the debrief.

2. **Reconstruct the timeline.** Build a chronological list of every documented touchpoint: first outreach, replies, calls, proposal send, follow-ups, final decision. Note the duration of each stage (days in discovery, days from proposal to decision, etc.).

3. **State the stated reason.** What did the prospect actually say (if they said anything)? If the prospect gave an explicit reason ("we went with another vendor," "budget was cut," "we decided not to do this now"), quote or paraphrase it here without editorializing.

4. **Analyze contributing factors.** This is the substantive step. For each contributing factor, look for evidence in the deal history:
   - **Timing:** Was the prospect in an active buying cycle or were they just exploring? Were there signals that timing was wrong that were visible early?
   - **Fit:** Did the deal qualify cleanly against your ICP? Were there fit issues that were visible in the intel card but not surfaced in the conversation?
   - **Competition:** Was there a named alternative? Were there signals they were evaluating alternatives?
   - **Process:** Did the deal stall at a specific stage? Was there a next step that never got confirmed?
   - **Pitch:** Did the framing match what the prospect cared about? Were there objections that came up that weren't handled well?
   - **Champion:** Was there a named internal champion? Did they have the authority or internal credibility to move the deal?
   Be direct about what the evidence shows. Avoid "we just got unlucky" or "they didn't get it" as root causes — these are almost always incomplete.

5. **What worked.** List 2–4 specific things that advanced the deal. If it's a loss, this still applies — most deals that die had some things working. If it's a win, be precise: was it the cold email angle? The discovery questions? The proposal structure? Specificity here is what makes the learnings transferable.

6. **What didn't work.** List 2–4 specific failure points. Same rule: specific, evidence-based, not retrospective rationalization. "The pricing was too high" is not useful unless you know what the prospect compared it to. "The proposal went out 2 weeks late and by then they'd moved on" is useful.

7. **Process changes.** Based on steps 4–6, write 1–3 specific, actionable changes to your sales process or pitch. Each change must be concrete enough that you'd know if you were doing it differently next time. "Get better at follow-up" is not a process change. "Send the follow-up sequence within 5 days of the proposal, not 14" is.

8. **ICP signal.** Does this deal update your picture of ideal customer? Specifically:
   - If closed-won: what characteristics of this account predicted success? Company size, stage, industry vertical, the specific problem they had, who the champion was?
   - If closed-lost or ghosted: what signals were visible early that predicted the deal would die? Which of those signals are in your current ICP definition and which are not?
   Write 2–4 sentences. This section feeds `icp-refinement` when that skill runs.

9. **Write and save wiki page.** Save to `wiki/win-loss-{deal-slug}.md` with full frontmatter. Mark `status: reviewed`.

10. **Update intel card.** Append to `wiki/prospect-{slug}.md` Activity Log:
    ```
    - {YYYY-MM-DD}: Deal closed. Outcome: {outcome}. Debrief: [[win-loss-{deal-slug}]].
    ```

11. **Confirmation.** Return the full debrief for review. If this is the 5th or more win-loss debrief in the vault, prompt: "You now have {n} debriefs in the vault. Run `icp-refinement` to extract patterns."

## Output format

```markdown
---
type: wiki
title: "Win/Loss Debrief: {Company} ({outcome})"
created: {YYYY-MM-DD}
status: reviewed
tags: [win-loss, cro, pipeline, {outcome}]
deal: "{slug}"
outcome: "{closed-won | closed-lost | ghosted}"
deal_value: ${value}
deal_duration_days: {n}
---

# Win/Loss Debrief: {Company} ({outcome})

## Deal Timeline
| Date | Event | Notes |
|------|-------|-------|
| {date} | {touchpoint} | {brief note} |

## Stated Reason
{What the prospect said, or "No explicit reason given — {outcome context}."}

## Contributing Factors
**Timing:** {analysis}
**Fit:** {analysis}
**Competition:** {analysis}
**Process:** {analysis}
**Pitch:** {analysis}
**Champion:** {analysis}

## What Worked
1. {Specific thing that advanced the deal}
2. {Specific thing}
3. {Specific thing}

## What Didn't Work
1. {Specific failure point}
2. {Specific failure point}

## Process Changes
1. {Concrete, actionable change}
2. {Concrete, actionable change}

## ICP Signal
{2–4 sentences on what this deal tells you about who is and isn't a fit.}
```

## Example output

```markdown
---
type: wiki
title: "Win/Loss Debrief: Meridian Logistics (closed-won)"
created: 2026-05-15
status: reviewed
tags: [win-loss, cro, pipeline, closed-won]
deal: "meridian-logistics"
outcome: "closed-won"
deal_value: 18000
deal_duration_days: 38
---

# Win/Loss Debrief: Meridian Logistics (closed-won)

## Deal Timeline
| Date | Event | Notes |
|------|-------|-------|
| 2026-04-07 | Cold email sent | Carrier fallout angle |
| 2026-04-09 | Reply from Dana | "This is exactly our problem" |
| 2026-04-28 | Discovery call | Qualified budget and timeline |
| 2026-05-03 | Proposal v1 sent | $18K, 8-week scope |
| 2026-05-12 | Verbal commit | Marcus signed off |
| 2026-05-15 | Contract signed | |

## Stated Reason (win)
Dana said: "The proposal was specific enough that we didn't feel like we were
buying a black box. And the fact that you'd already done the work to understand
our carrier fallout number before the first call — that built a lot of trust."

## Contributing Factors
**Timing:** Active buying cycle. The TMS analyst job posting was a real signal —
they were mid-evaluation when we reached out.
**Fit:** Strong. 40-person brokerage with a documented ops pain is squarely in
the target.
**Competition:** One unnamed alternative evaluated. Dana said our proposal was
more scoped.
**Process:** Clean. Discovery → proposal → verbal in 38 days. No stall points.
**Pitch:** The carrier fallout data angle in the cold email was the unlock.
Generic outreach would not have gotten a reply.
**Champion:** Dana was the champion and had ops authority. Marcus was the budget
sign-off — including him in the second meeting closed the authority gap early.

## What Worked
1. The intel card angle — finding Dana's post before outreach set the entire frame.
2. Including Marcus in the second meeting rather than waiting for Dana to escalate.
3. The proposal named what was out of scope — that specificity reduced perceived risk.

## What Didn't Work
1. Proposal went out 5 days after the discovery call — could have been 2 days. No
   evidence it hurt this deal, but unnecessary delay.
2. Didn't document the competition signal until after the deal closed — that Intel
   should have been in the prospect file.

## Process Changes
1. Send proposal within 48 hours of discovery call, not 5 days.
2. Ask directly about alternatives in every discovery call: "Are you evaluating
   other options in parallel?" Add this to the discovery questions template.

## ICP Signal
Mid-market freight brokerages (30–60 employees, Southeast US) with visible ops
hiring and documented carrier fallout pain are high-conversion prospects. The
TMS analyst job posting was the strongest pre-outreach signal found to date.
Add "ops analyst or RevOps JD in target category" as an ICP signal to watch.
```
