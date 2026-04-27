---
name: sales-call-prep
description: Build a context document for an upcoming sales call — account snapshot, discovery questions, objection responses, and the one thing you want to leave with.
version: 1.0.0
trigger:
  - "prep for sales call with"
  - "call prep for"
  - "I have a call with"
  - "prepare for my meeting with"
  - "get me ready for"
  - "sales call tomorrow with"
  - "discovery call prep"
  - "what should I know before my call"
inputs:
  - name: deal_name
    description: Company name or deal slug — used to pull the prospect intel card and any prior call notes
    required: true
  - name: deal_stage
    description: Current stage — e.g., "first discovery," "post-demo follow-up," "negotiation," "renewal"
    required: true
  - name: calendar_event
    description: Google Calendar event ID, link, or description of the scheduled call — used to pull time, attendees, and any attached notes
    required: false
  - name: call_goal
    description: What you need from this specific call — e.g., "qualify budget," "resolve legal objection," "get verbal commitment"
    required: false
output_artifact: journal/YYYY-MM-DD-call-prep-{slug}.md
frequency: on-demand
pack: cro
---

## When to run

Run the morning of a sales call or the night before. This skill pulls everything Hermes knows about the deal — from the prospect intel card, prior call notes, and any win/loss patterns in the vault — and synthesizes it into a single prep document you read in 5 minutes before joining.

Run it for every deal call until you have the account fully internalized. For second and third calls with the same account, the prior call notes from the journal become the anchor; the intel card provides the static context.

## What you'll get

A journal page saved to `journal/YYYY-MM-DD-call-prep-{slug}.md` with:

- Account snapshot (pulled from intel card, compressed to what's relevant today)
- Call objective and the one thing you want to leave with
- Attendee context (who's on the call and what you know about each person)
- Discovery questions tuned to deal stage — not a generic list
- Likely objections and how to handle each one honestly
- What not to say (known sensitivities from the deal history)
- 5-minute pre-call checklist

## Steps

1. **Pull calendar context** (if `calendar_event` provided). Use the Google Calendar MCP to read the event: time, duration, attendees, any attached notes or agenda. Extract the list of attendees on the prospect side — these are the people you're prepping for.

2. **Load intel card.** Query `vault.db` for `wiki/prospect-{slug}.md`. Load full content. Extract: company overview, decision-maker map, talking points, signals, open questions, activity log. If no intel card exists, flag this as a gap — prompt to run `prospect-research` first, but do not halt if the user wants to proceed with manual context.

3. **Load prior call notes** (if any). Query `vault.db` for `journal/*-call-prep-{slug}.md` and any `journal/*-meeting-prep-{slug}.md` entries. Load the most recent 2–3. Extract: what was discussed, what commitments were made, what the prospect said they cared about, what objections came up.

4. **Synthesize account snapshot.** 5–7 sentences maximum. What is this company, why did you reach out, where are they in the deal, and what is the primary open question going into today's call.

5. **Define call objective.** If `call_goal` was provided, use it. If not, infer from `deal_stage`: discovery calls should aim to qualify 3 dimensions (problem clarity, budget existence, timeline reality); post-demo calls should aim to get a named next step; negotiation calls should aim to close one open term.

6. **Write discovery questions.** Generate 5–8 questions calibrated to the deal stage:
   - First discovery: open-ended questions about the problem, current approach, and what a win looks like for them
   - Post-demo: questions about what resonated, what didn't, who else is evaluating
   - Negotiation: specific questions about the outstanding terms, not open-ended exploration
   Do not include questions whose answers are already in the intel card or prior call notes. Don't ask things you already know.

7. **Map objections.** From the intel card, prior notes, and deal stage, anticipate 2–4 objections that are likely in this call. For each: state the objection plainly, then write a 2–3 sentence honest response. "Honest" means: if the objection has merit, acknowledge it. Don't spin. The goal is to have thought it through before it comes up, not to have a script.

8. **Pre-call checklist.** Five items maximum:
   - Any materials to have open (proposal, case study, prior call notes)
   - Any commitments from the last call that need following up on
   - The one thing you want to leave with (specific)
   - Any known sensitivities (topics to avoid or tread carefully on)
   - Backup ask if the primary goal doesn't land

9. **Write and save journal page.** Save to `journal/YYYY-MM-DD-call-prep-{slug}.md` with today's date. Mark `status: draft` — user reviews before the call.

10. **Confirmation.** Return the full document for review. Prompt: "After the call, add your notes to this journal page. Run `win-loss-debrief` if the deal closes or dies."

## Output format

```markdown
---
type: journal
title: "Call Prep: {Company} — {deal_stage} ({YYYY-MM-DD})"
created: {YYYY-MM-DD}
status: draft
tags: [call-prep, cro, pipeline]
deal: "{slug}"
deal_stage: "{deal_stage}"
call_time: "{HH:MM} {timezone}"
attendees: []
---

# Call Prep: {Company} — {deal_stage}

**Call time:** {time and timezone}
**My goal for this call:** {one sentence}
**The one thing I need to leave with:** {specific output — a named next step, a decision, a commitment}

---

## Account Snapshot
{5–7 sentences: company, why in pipeline, deal history compressed}

## Who's on the Call
| Name | Title | What I know |
|------|-------|-------------|
| {name} | {title} | {1–2 sentences from intel card or prior notes} |

## Discovery Questions
1. {Question — stage-appropriate}
2. {Question}
3. {Question}
4. {Question}
5. {Question}

## Likely Objections
**"{objection}"**
Response: {2–3 sentences, honest}

**"{objection}"**
Response: {2–3 sentences, honest}

## Pre-Call Checklist
- [ ] {Material to have open}
- [ ] {Prior commitment to follow up on}
- [ ] {Primary ask: [specific]}
- [ ] {Sensitivity to tread carefully on}
- [ ] {Backup ask if primary doesn't land}

## Post-Call Notes
{Leave blank — fill in after the call}
```

## Example output

```markdown
---
type: journal
title: "Call Prep: Meridian Logistics — First Discovery (2026-04-28)"
created: 2026-04-28
status: draft
tags: [call-prep, cro, pipeline]
deal: "meridian-logistics"
deal_stage: "first-discovery"
call_time: "14:00 ET"
---

# Call Prep: Meridian Logistics — First Discovery

**Call time:** 2:00 PM ET, 30 min
**My goal for this call:** Confirm that carrier acceptance is an ops-owned
problem with real urgency, not a "nice to have for later."
**The one thing I need to leave with:** A second meeting with Dana plus
confirmation of whether Marcus needs to be involved in a decision.

---

## Account Snapshot
Meridian is a 40-person freight brokerage in the Southeast US. No disclosed
funding, likely bootstrapped. Dana Perez (VP Ops) replied to the cold email
referencing the carrier fallout benchmark. The intel card shows 18% fallout
vs. 12% industry median. They posted 4 RevOps-adjacent job listings in Q1.
The open question is whether they have the budget and authority to move in
the next 90 days.

## Who's on the Call
| Name | Title | What I know |
|------|-------|-------------|
| Dana Perez | VP Operations | Wrote the carrier fallout post. Replied to the cold email quickly. |

## Discovery Questions
1. What's driving the carrier fallout — is it concentrated in specific lanes
   or carrier relationships, or is it spread across the board?
2. How are you currently handling the tendering sequence — is that managed
   in your TMS or is it manual?
3. What does "fixed" look like for this problem — is there a number you're
   trying to hit?
4. Is this a decision you can make at the ops level, or does Marcus need to
   be in the room for anything commercial?
5. What's your timeline — is there a quarter where this becomes urgent vs. a
   "we should get to it" item?

## Likely Objections
**"We're already working on this internally."**
Response: Good to know — what does that look like? Most of the brokerages
we've talked to have tried to solve it in the TMS and hit the same ceiling.
Happy to compare notes on what they found.

**"We don't have budget right now."**
Response: Understood. Can I ask — is that a Q2 thing or a no-budget-this-year
thing? We've structured pilots for brokerages at your stage; happy to talk
about what that looks like if timing matters.

## Pre-Call Checklist
- [ ] Have the carrier acceptance benchmark PDF ready to share screen
- [ ] No prior commitments to follow up on (first contact)
- [ ] Primary ask: second meeting with Marcus included
- [ ] Sensitivity: don't name any specific TMS vendors — Dana mentioned
  frustration with their current stack, vendor hasn't been ID'd
- [ ] Backup ask: share the case study async if the second meeting doesn't land
```
