---
name: cold-outreach-email
description: Draft a personalized first-touch cold email grounded in prospect research — not a template fill, a real email built from what you actually found.
version: 1.0.0
trigger:
  - "write a cold email to"
  - "draft outreach to"
  - "email to this prospect"
  - "first touch email for"
  - "reach out to"
  - "contact this person"
  - "write an outreach email"
  - "draft an email to this lead"
inputs:
  - name: prospect
    description: Company name, person name, or slug matching an existing wiki/prospect-{slug}.md. If no intel card exists, the skill runs prospect-research first.
    required: true
  - name: goal
    description: What you want from this email — e.g., "book a 20-min discovery call," "share a relevant case study," "intro the product"
    required: true
  - name: from_name
    description: Your name and title as it should appear in the email
    required: false
  - name: tone_notes
    description: Any specific tone constraints — e.g., "peer to peer, not salesy," "formal, they're at a bank," "casual — we have a mutual connection"
    required: false
output_artifact: gmail-draft + wiki/prospect-{slug}.md update
frequency: on-demand
pack: cro
---

## When to run

Run after `prospect-research` has produced an intel card. The cold email is the first contact — it gets one shot. Running this skill without a prospect intel card produces generic output; with one, it produces an email the recipient will read past the first sentence.

Run this when you have a named prospect, a specific goal for the conversation, and at least 2–3 real signals from the intel card to anchor the message.

## What you'll get

A Gmail draft created directly in your Gmail account via the Gmail MCP. The draft is ready to review, edit, and send — no copy-paste required. The subject line, body, and send-to address are pre-filled.

The skill also appends an activity log entry to `wiki/prospect-{slug}.md` recording that the draft was created, the subject line used, and the date.

You will not get a template. You will get one email, built from the actual research, that says something specific about this person or company that only someone who did the homework could say.

## Steps

1. **Load intel card.** Query `vault.db` for `wiki/prospect-{slug}.md`. If found, load the full content — especially Talking Points, Recent Signals, and Decision-Maker Map. If no card exists, halt and run `prospect-research` first. Do not proceed to drafting without research.

2. **Select the primary angle.** From the intel card's Talking Points, pick the one most directly tied to the goal provided. If the goal is "book a discovery call," pick the angle that creates the most obvious reason for that call to happen. If the goal is "share a case study," pick the angle where the case study outcome most directly mirrors the prospect's documented pain.

3. **Draft the subject line.** The subject line must be specific to this prospect — not a generic curiosity hook. Aim for 5–8 words. Options: a specific problem you observed, a specific outcome you can tie to their situation, or a direct reference to something they published or said. Do not use subject lines that could apply to any prospect ("Quick question," "Saw your company," "Thought you'd find this useful").

4. **Draft the email body.** Hard constraints:
   - Opening line: name the specific thing you found — a job posting, a post they wrote, a signal from the intel card. Do not open with "I came across your company" or "I hope this email finds you well." Do not open with a compliment about their company.
   - Body: one specific sentence connecting what you found to what you do and why it's relevant for them now. Not a product pitch. A "here's why I thought of you specifically" sentence.
   - Ask: one clear, low-friction ask. A call, a reply, a question — not a demo request in the first email unless the goal explicitly calls for it.
   - Close: your name, title, and one line that makes it easy to say yes or no.
   - Length: 100–150 words total. If it's longer, cut.

5. **Create Gmail draft.** Use the Gmail MCP to create the draft with:
   - `to`: the contact email if available from the intel card; otherwise leave the `to` field blank and note it in the confirmation
   - `subject`: the subject line from step 3
   - `body`: the plain-text email from step 4

6. **Update the intel card.** Append to `wiki/prospect-{slug}.md` Activity Log:
   ```
   - {YYYY-MM-DD}: Cold outreach draft created. Subject: "{subject line}". Draft in Gmail.
   ```

7. **Confirmation.** Return the full email text for review, the subject line, and the Gmail draft link or confirmation. Note any missing fields (to address, etc.) the user needs to fill before sending.

## Output format

```
SUBJECT: {subject line}

{email body — 100–150 words}

---
Gmail draft created: ✓
Intel card updated: wiki/prospect-{slug}.md
Missing: {to address — paste in before sending / nothing}
```

## Example output

```
SUBJECT: 4 RevOps hires + 18% carrier fallout — worth 20 minutes?

Dana,

Your Q1 dispatch post cited 18% carrier fallout — above the 12% industry
median. We looked at the same metric across 14 freight brokerages before
building the carrier acceptance module in our dispatch layer. The ones
above 15% almost always had the same root cause: load tendering sequencing
rather than rate.

We work with ops teams at mid-market brokerages in the 30–80 person range.
Happy to show you what the diagnostic looks like — 20 minutes, no demo
deck, just your numbers.

Worth a call this or next week?

[Your name]
[Title]

---
Gmail draft created: ✓
Intel card updated: wiki/prospect-meridian-logistics.md
Missing: to address — Dana Perez's email not found in public sources.
Find via LinkedIn Sales Nav or Hunter.io before sending.
```
