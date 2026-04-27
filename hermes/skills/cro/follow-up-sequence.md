---
name: follow-up-sequence
description: Write a 3-touch follow-up sequence for a prospect who hasn't responded — each email distinct, each one earns the next ask.
version: 1.0.0
trigger:
  - "write follow-up emails for"
  - "follow up sequence for"
  - "prospect hasn't responded"
  - "draft follow-ups for"
  - "3 touch sequence for"
  - "they went quiet"
  - "no response from"
  - "re-engage this prospect"
inputs:
  - name: prospect
    description: Company name, person name, or slug matching an existing wiki/prospect-{slug}.md
    required: true
  - name: last_contact_date
    description: Date of the last email or touchpoint — used to time the sequence
    required: true
  - name: deal_context
    description: Where this prospect is in your pipeline — did they reply once and go cold, did they attend a demo, did they request a proposal? What happened last?
    required: true
  - name: goal
    description: What you want from the sequence — typically "get a reply" or "book a call" or "confirm they're still interested"
    required: false
output_artifact: 3 Gmail drafts
frequency: on-demand
pack: cro
---

## When to run

Run when a prospect has gone quiet after initial contact or after a previously active conversation. This is for deals that are alive in your head but silent in your inbox.

The follow-up sequence is the work that 90% of founders skip. Not because they don't know to do it — because writing three distinct, non-annoying follow-ups is genuinely hard. This skill writes them. You review and send.

Do not run this if the prospect explicitly said no. Do not run this if fewer than 5 business days have passed since your last touch. Silence after 5 days is fair game.

## What you'll get

Three Gmail drafts, each scheduled with a suggested send delay relative to the last contact:

- **Touch 2** (follow-up 1): 5–7 business days after last contact
- **Touch 3** (follow-up 2): 7–10 business days after touch 2
- **Touch 4** (break-up): 10–14 business days after touch 3

Each draft is distinct in angle — not a rewording of the same pitch. Each one either adds new value, shifts the frame, or lowers the friction of the ask. The break-up email is honest and closes the loop cleanly.

## Steps

1. **Load intel card.** Query `vault.db` for `wiki/prospect-{slug}.md`. Load full contents — Talking Points, Recent Signals, Activity Log, Fit Assessment. The sequence must reference the specific context of this deal, not generic follow-up language.

2. **Review activity log.** From the intel card's Activity Log, identify: what was the first email subject line, what angle was used, what ask was made. The follow-up sequence must not repeat the same angle.

3. **Draft Touch 2 — new value angle.** This email does not restate the pitch. It adds one concrete, specific piece of value: a relevant result from a similar company, a new signal you found about their business since the last email, a question that makes them think differently about the problem. Length: 80–120 words. Subject line: different from Touch 1. Ask: softer than Touch 1 — a reply, a question, not a meeting request unless context warrants it.

4. **Draft Touch 3 — shift the frame.** If Touch 2 didn't land, change the angle entirely. Address a different contact from the decision-maker map (if there are alternatives), or address a different problem the intel card surfaced, or reframe the value from cost-savings to risk-reduction or vice versa. Do not apologize for following up. Do not say "just checking in." Do not say "I wanted to circle back." Length: 60–90 words. Ask: specific and easy — a yes/no question.

5. **Draft Touch 4 — break-up email.** This email closes the loop. It acknowledges that you're going to stop reaching out. It gives one final, low-friction path back in if timing changes. Tone is direct and respectful, not guilt-tripping. Length: 40–60 words. No pitch. No ask beyond "let me know if timing changes." This is the email that most often gets a reply — because it's honest.

6. **Create 3 Gmail drafts.** Use the Gmail MCP to create each draft. Include suggested send dates in the draft body as a comment line: `// Suggested send: {date}`. Populate `to` from the intel card if available.

7. **Update intel card.** Append to `wiki/prospect-{slug}.md` Activity Log:
   ```
   - {YYYY-MM-DD}: Follow-up sequence drafted (Touch 2, 3, 4). Drafts in Gmail.
   ```

8. **Confirmation.** Return all three emails for review with suggested send dates. Flag any gaps — missing contact email, unclear deal context, anything that should be verified before sending.

## Output format

```
TOUCH 2 — Send: {date, ~5–7 days from last contact}
SUBJECT: {subject line}

{email body — 80–120 words}

---

TOUCH 3 — Send: {date, ~12–17 days from last contact}
SUBJECT: {subject line}

{email body — 60–90 words}

---

TOUCH 4 (break-up) — Send: {date, ~22–31 days from last contact}
SUBJECT: {subject line}

{email body — 40–60 words}

---
3 Gmail drafts created: ✓
Intel card updated: wiki/prospect-{slug}.md
```

## Example output

```
TOUCH 2 — Send: 2026-05-03
SUBJECT: Carrier fallout benchmark — quick data point

Dana,

Since my last email I pulled the carrier acceptance rate benchmarks from
our 2025 freight brokerage cohort. Median was 88%. Brokerages above 92%
had one thing in common: they'd moved from sequential to parallel tendering
in the prior 12 months.

Relevant to what you posted in February. If you want the full breakdown —
5 slides, no pitch — happy to share.

[Your name]

---

TOUCH 3 — Send: 2026-05-13
SUBJECT: Different question

Dana,

Shifting gears — is the carrier fallout problem actually yours to solve,
or does it live in a different part of the org? If Marcus or someone else
is the right conversation, just point me that way.

[Your name]

---

TOUCH 4 (break-up) — Send: 2026-05-24
SUBJECT: Closing the loop

Dana,

Going to stop reaching out — clearly not the right moment. If carrier
acceptance or dispatch tooling becomes a priority later, happy to pick
this back up.

[Your name]

---
3 Gmail drafts created: ✓
Intel card updated: wiki/prospect-meridian-logistics.md
```
