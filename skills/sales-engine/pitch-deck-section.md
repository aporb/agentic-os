---
name: pitch-deck-section
description: Draft or improve a section of your pitch deck based on your vault knowledge.
version: 1.0.0
trigger: "pitch deck", "investor deck", "pitch slide", "investor presentation", "fundraising"
---

# Pitch Deck Section

Draft or improve individual sections of your pitch deck. Each section gets clear, concise copy backed by your actual data.

## When to Use

- You're building a pitch deck from scratch
- You need to improve a specific slide or section
- You're preparing for fundraising

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| section | Yes | Which section: `problem`, `solution`, `market`, `traction`, `team`, `ask`, `competition` |
| data | No | Any specific numbers, customer names, or metrics to include |

## Steps

1. **Check the vault** — Search for relevant data: customer intel, market research, financial tracking, competitive analysis. Real data beats claims.
2. **Draft the section** — Rules for pitch copy:
   - Maximum 15 words per slide headline
   - Bullet points, not paragraphs
   - Specific numbers, not "large" or "growing"
   - Show, don't tell ("42 customers in 6 months" not "rapid adoption")
3. **Add speaker notes** — Write what you'd actually SAY when presenting this slide. 2-3 sentences. Conversational, not scripted.
4. **Present** — Show the slide copy + speaker notes.

## Output

Slide copy (headline + bullets) + speaker notes. Delivered directly for review.

## Pitfalls

- **"We have no competition"**: Investors hear "you haven't done your research." Always include competition — and why you win.
- **Vague market sizing**: "The AI market is $500B" means nothing. What's YOUR specific segment? TAM → SAM → SOM.
- **Too many words**: If a slide has more than 30 words total, split it into two slides. Investors don't read walls of text.
