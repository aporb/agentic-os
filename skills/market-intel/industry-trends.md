---
name: industry-trends
description: Scan an industry for recent trends, shifts, and emerging patterns.
version: 1.0.0
trigger: "industry trends", "what's happening in", "market trends", "industry scan"
---

# Industry Trends

Scan an industry or market segment for recent developments, emerging patterns, and shifts that affect your business.

## When to Use

- You need to understand what's changing in your market
- You're preparing a pitch or investor update
- You want to spot opportunities before competitors do

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| industry | Yes | The industry or market to scan (e.g., "GovCon SaaS", "AI consulting") |
| timeframe | No | How far back to look: `1week`, `1month`, `1quarter` (default: 1month) |

## Steps

1. **Run targeted searches** — Search for: `[industry] trends 2026`, `[industry] funding rounds`, `[industry] mergers acquisitions`, `[industry] new entrants`, `[industry] regulatory changes`.
2. **Scan news sources** — Collect results from the past timeframe. Deduplicate.
3. **Identify patterns** — Group findings into themes. Are multiple sources reporting the same shift? That's a trend. One source? That's a data point.
4. **Rate significance** — For each trend:
   - **High**: Affects your revenue or customers directly within 90 days
   - **Medium**: Affects the landscape within 6-12 months
   - **Low**: Interesting but not actionable now
5. **Write the scan** — Produce a structured trend report.
6. **Save** — Write to `wiki/trends-[industry-slug].md`

## Output

**File**: `wiki/trends-[industry-slug].md`

```markdown
# Industry Trends: [Industry Name]
**Scanned:** YYYY-MM-DD | **Timeframe:** [timeframe]

## High Significance
- **[Trend 1]** — What's happening, why it matters, source
- **[Trend 2]** — ...

## Medium Significance
- ...

## Low Significance (Watching)
- ...

## What This Means for Us
[2-3 sentences connecting trends to your strategy]
```

## Pitfalls

- **Conflicting trends**: Sometimes you'll find data pointing in opposite directions. Surface both. Don't force a clean narrative.
- **Echo chambers**: If all your sources are from the same niche, you're missing the full picture. Include mainstream business press.
- **Trend fatigue**: Not everything is a trend. Some things are just noise. If you can't explain why it matters in one sentence, it's noise.
