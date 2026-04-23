---
name: competitor-research
description: Research a competitor and produce a one-page intel brief.
version: 1.0.0
trigger: "research competitor", "what is [company] doing", "who are my competitors", "competitive analysis"
---

# Competitor Research

Research any company or product and produce a one-page intelligence brief. No guesswork — everything backed by real data.

## When to Use

- You want to understand what a competitor is doing
- You're preparing for a pitch and need to know the landscape
- You're evaluating whether to enter a new market
- Someone asks "who else is doing this?"

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| company | Yes | Name of the company or product to research |
| focus | No | What you care about: `product`, `pricing`, `customers`, `tech` (default: all) |

## Steps

1. **Search for the company** — Find their website, product page, pricing page, about page. Also search for recent news, funding, and press mentions.
2. **Check GitHub** (if applicable) — Search for their repos. Note: stars, last commit date, number of contributors, open issues.
3. **Find social presence** — Check Twitter/X, LinkedIn, YouTube. Note: follower counts, posting frequency, engagement levels, what they talk about.
4. **Find real users** — Search for reviews, Reddit threads, HN discussions, G2/Capterra listings. What do actual customers say?
5. **Synthesize** — Write a one-page brief covering:
   - What they do (1-2 sentences)
   - Who they serve (target customer)
   - How they make money (pricing model and numbers)
   - What they're good at
   - Where they're weak
   - How you're different
6. **Save** — Write to `wiki/intel-[company-name].md`

## Output

**File**: `wiki/intel-[company-name].md`

A one-page brief with the sections above. Honest assessment — not just confirming what you want to hear.

## Pitfalls

- **Only finding marketing copy**: Company websites lie. Trust user reviews, GitHub activity, and third-party coverage over official claims.
- **Ignoring small competitors**: The biggest threat often isn't the market leader. It's the scrappy startup that's 6 months behind you.
- **Analysis paralysis**: This should take 30 minutes, not 3 days. Set a timebox. Ship what you have.
