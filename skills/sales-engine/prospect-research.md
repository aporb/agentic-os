---
name: prospect-research
description: Research a potential customer before reaching out. Find their pain points, recent activity, and conversation starters.
version: 1.0.0
trigger: "research prospect", "look up", "who is", "company research for outreach", "sales intel"
---

# Prospect Research

Research a potential customer or client before you reach out. Find what they care about, what they're struggling with, and how to start the conversation.

## When to Use

- You're about to reach out to a potential customer
- You want to understand a company before a sales call
- You need a warm intro angle for cold outreach

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| company | Yes | Company name or person's name |
| your_product | No | What you sell (to find the angle) |

## Steps

1. **Find the company basics** — Website, what they do, who leads them, how big they are, who their customers are.
2. **Find recent activity** — Search for: recent news, funding, product launches, hiring, blog posts, executive changes. Last 90 days.
3. **Find the people** — Who's the decision maker? Search LinkedIn for titles like VP/Director/Head of [relevant department]. Note their background and recent posts.
4. **Identify pain points** — Based on their industry, recent changes, and public statements, what are they likely struggling with? Be specific, not generic.
5. **Find the angle** — How does what you sell connect to their specific situation? Write 2-3 possible conversation starters.
6. **Save** — Write to `wiki/prospect-[company-slug].md`

## Output

**File**: `wiki/prospect-[company-slug].md`

```markdown
# Prospect: [Company Name]

## At a Glance
- **What they do**: [1 sentence]
- **Size**: [employees, revenue if known]
- **Key decision maker**: [Name, Title]

## What's Happening (Last 90 Days)
- [Recent event or change]
- [Recent event or change]

## Likely Pain Points
1. [Specific pain point with evidence]
2. [Specific pain point with evidence]

## Conversation Starters
1. "[Opening line that references something specific about them]"
2. "[Alternative opening]"
3. "[Alternative opening]"

## How We Fit
[2-3 sentences connecting your product to their situation]
```

## Pitfalls

- **Stale intel**: If the only news is from 2024, say so. Don't present old information as current.
- **Generic pain points**: "They probably want to save time and money" applies to every company on earth. Be specific to their situation.
- **Creepy outreach**: Don't reference personal details from LinkedIn that would feel invasive. Professional observations only.
