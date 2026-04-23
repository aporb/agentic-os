---
name: outreach-email
description: Draft a cold or warm outreach email based on prospect research.
version: 1.0.0
trigger: "write outreach email", "cold email", "sales email", "intro email", "reach out to"
---

# Outreach Email

Draft an outreach email that gets replied to. Based on prospect research, not templates.

## When to Use

- You need to email someone you don't know well
- You're following up on a lead
- You want to start a conversation with a potential customer

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| prospect | Yes | Company name or person (will check wiki for existing research) |
| goal | Yes | What you want from the email: `meeting`, `feedback`, `intro`, `partnership` |
| context | No | Any prior connection, referral, or shared context |

## Steps

1. **Check the vault** — Search for `wiki/prospect-[company].md`. If it exists, use the research. If not, suggest running the prospect-research skill first.
2. **Find the specific angle** — Don't write a generic email. Reference something specific: a recent blog post they wrote, a hire they made, a problem they mentioned publicly.
3. **Draft 2 versions**:
   - Version A: Direct. State why you're emailing in the first sentence. 3-4 sentences total.
   - Version B: Softer. Lead with a question or observation about their situation. Then connect to what you do.
4. **Check the rules**:
   - Maximum 5 sentences. If it's longer, cut it.
   - No "I hope this email finds you well"
   - No "I'd love to" (overused)
   - No attachments in cold emails
   - Subject line: 3-6 words. Specific, not clever.
5. **Present both versions** — Let the user choose and edit.

## Output

2 email versions + subject lines. Delivered directly, not saved to vault (these are personal communications).

## Pitfalls

- **Writing a novel**: Cold emails over 5 sentences get deleted. Period.
- **Leading with "I"**: "I am the founder of..." — they don't care. Start with something about them.
- **No clear ask**: If the recipient can't tell what you want in 3 seconds, the email is too vague.
- **Following up too aggressively**: One follow-up after 3-5 days. Then let it go.
