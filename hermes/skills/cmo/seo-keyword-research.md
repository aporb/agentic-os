---
name: seo-keyword-research
description: Research keyword opportunities for a focus topic — intent mapping, search volume estimates, competitor gaps, and People Also Ask data via web search.
version: 1.0.0
trigger:
  - "seo keyword research"
  - "keyword research for"
  - "what keywords should I target"
  - "find keywords for"
  - "seo research on"
  - "keyword gaps for"
  - "search terms for"
  - "find what people search for"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: focus_topic
    description: The main subject area or cluster you want to rank for — e.g. "AI operations for solo founders" or "content calendar tools"
    required: true
  - name: competitors
    description: Optional list of 2–4 competitor domains or brands to audit for keyword gaps — e.g. "notion.so, coda.io"
    required: false
  - name: audience_context
    description: Brief description of who you're writing for — helps classify informational vs. transactional intent accurately
    required: false
output_artifact: "wiki/seo-research-[topic-slug].md"
frequency: on-demand
pack: cmo
---

## When to run

Before planning a new content cluster, before refreshing a content calendar, or monthly as part of an SEO audit. Run it when you're deciding what to write next and want the decision to be based on actual search demand rather than what seems interesting.

Also run it when a competitor is outranking you for terms you believe you should own. Feed their domain into `competitors` and the skill surfaces the keyword gaps worth closing first.

## What you'll get

A structured keyword research table with intent classification, search volume estimates sourced from web research (explicitly marked "estimate unavailable" where data cannot be retrieved), and a People Also Ask section drawn from SERP data via the search tools. The output is saved to the vault for reference in future content planning.

One important constraint: this skill uses `ddgr` and `gogcli` for web search, not a paid SEO API. Volume figures are estimates derived from SERP features, autocomplete signals, and publicly available data. Where an estimate cannot be substantiated, the table will say so. Do not treat these figures as authoritative.

## Steps

1. Parse `focus_topic`. Derive 3–5 seed keywords: the core term itself, plus broader and narrower variants. Example: for "AI operations for solo founders," seeds might include "AI operations," "solo founder tools," "agentic AI for small business," "AI second brain," "AI ops tools."

2. Search the vault for any prior SEO research on this topic: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/seo-research-%' ORDER BY updated DESC LIMIT 5;"`. Read any related research pages. Note which keywords were already targeted and whether any blog posts or pages already exist for them.

3. For each seed keyword, run a web search via `ddgr`: `ddgr --json --num 10 "<seed keyword>"`. Examine the top 10 results for each seed. From the results, extract:
   - The specific phrasing of competing pages (titles and H1s reveal the keywords they're targeting)
   - The result types (blog posts, product pages, forums, tools — this signals intent)
   - Any featured snippet text (signals exactly what Google thinks the answer should be)

4. Expand the keyword list from search results. For each seed, note the related searches, autocomplete suggestions (search for "<seed keyword> " with a trailing space to surface Google's autocomplete variants), and anchor text patterns from the results pages.

5. Classify each keyword by intent:
   - **Informational:** the searcher wants to learn something. "What is AI ops," "how to build a content calendar," "what is a second brain." These keywords drive blog and newsletter traffic.
   - **Transactional:** the searcher is evaluating or ready to buy. "Best AI ops tools," "content calendar software," "agentic OS alternatives." These keywords drive landing page traffic.
   - **Navigational:** the searcher is looking for a specific brand or product. These are lower priority unless you're trying to intercept competitor branded searches.

6. Estimate search volume. For each keyword, search for: "[keyword] site:semrush.com OR site:ahrefs.com OR site:moz.com" to see if any free tools surface volume data. Also check if the keyword appears in any publicly available "keyword research" blog posts with volume data. Record findings as:
   - **Confirmed estimate:** a specific volume number with the source cited
   - **Range estimate:** e.g. "100–1K/mo" when multiple indirect signals are consistent
   - **Estimate unavailable:** when no reliable signal exists — do not invent a number

7. Pull People Also Ask (PAA) data. Search for each seed keyword and record the PAA questions that appear. These represent sub-topics the searcher considers adjacent to the main query. They are often the best keywords to target for featured snippets and are frequently underserved by existing content. Record the PAA questions verbatim from the SERP.

8. If `competitors` are provided, run a gap analysis. For each competitor domain, search: "site:<competitor-domain> <seed-keyword>" to surface their indexed content for each keyword. Note which of your seed keywords have strong competitor coverage (harder to rank) vs. light coverage (opportunity). Also search for the competitor brand name directly to identify any keywords in their titles or descriptions that you haven't covered.

9. Prioritize the keyword list. Score each keyword on two axes:
   - **Opportunity:** low competitor coverage + reasonable search signal + matches your content strengths
   - **Intent fit:** transactional keywords go to landing pages; informational keywords go to blog/newsletter. Mismatched intent is the most common SEO mistake — a blog post targeting a transactional keyword will never rank.
   Flag the top 5–8 keywords as "Priority" in the output table.

10. Write the People Also Ask section. For the top 3–5 PAA questions, write a 2–3 sentence draft answer. These answers are starting points for featured-snippet-optimized content — short, direct, correct, formatted as a paragraph (not a list) since Google prefers paragraph answers for most PAA displays.

11. Save the full research output to `wiki/seo-research-[topic-slug].md`.

## Output format

```yaml
---
type: wiki
title: "SEO Keyword Research — [Topic]"
created: YYYY-MM-DDT00:00:00
updated: YYYY-MM-DDT00:00:00
status: reviewed
tags: [seo, cmo, keyword-research, <topic-tag>]
sources: [web-search-ddgr, <competitor-domains-if-used>]
focus_topic: "<topic>"
---
```

```markdown
# SEO Keyword Research — [Topic]

**Researched:** YYYY-MM-DD
**Tools:** ddgr / gogcli (no paid SEO API — volume estimates only)
**Note:** Volume figures are estimates from web signals. Treat as directional, not authoritative.

---

## Keyword Table

| Keyword | Intent | Volume Estimate | Difficulty Signal | Priority | Notes |
|---------|--------|----------------|-------------------|----------|-------|
| [keyword] | Informational | 1K–10K/mo (Semrush excerpt) | Medium — 5 strong competitors | YES | Good featured-snippet candidate |
| [keyword] | Transactional | Estimate unavailable | Low — 2 relevant results | YES | Underserved; write landing page |
| [keyword] | Informational | 100–1K/mo (Ahrefs blog cite) | Low | YES | PAA coverage exists — opportunity |
| [keyword] | Navigational | Estimate unavailable | N/A — competitor branded | NO | Monitor only |

---

## People Also Ask

**Q: [PAA question verbatim]**
[2–3 sentence answer, paragraph format, optimized for featured snippet]

**Q: [PAA question verbatim]**
[2–3 sentence answer]

**Q: [PAA question verbatim]**
[2–3 sentence answer]

---

## Competitor Gap Analysis

[If competitors provided:]

### [competitor-domain]
- Strong coverage: [keywords where they dominate]
- Gaps: [keywords in your list where they have weak or no coverage]

---

## Content Recommendations

Priority content to produce (based on this research):
1. [Content type + working title + keyword target]
2. [Content type + working title + keyword target]
3. [Content type + working title + keyword target]
```

## Example output (truncated)

```markdown
---
type: wiki
title: "SEO Keyword Research — AI Operations for Solo Founders"
created: 2026-04-28T10:00:00
status: reviewed
tags: [seo, cmo, keyword-research, ai-ops, solo-founders]
focus_topic: "AI operations for solo founders"
---

# SEO Keyword Research — AI Operations for Solo Founders

**Researched:** 2026-04-28
**Tools:** ddgr / gogcli (no paid SEO API — volume estimates only)
**Note:** Volume figures are estimates from web signals. Treat as directional, not authoritative.

---

## Keyword Table

| Keyword | Intent | Volume Estimate | Difficulty Signal | Priority | Notes |
|---------|--------|----------------|-------------------|----------|-------|
| AI operations solo founder | Informational | Estimate unavailable | Low — 3 results, none authoritative | YES | Emerging term; first-mover opportunity |
| agentic AI for small business | Informational | 100–1K/mo (Ahrefs blog, April 2026) | Medium | YES | Strong PAA presence |
| second brain AI | Informational | 1K–10K/mo (Semrush excerpt, March 2026) | High — 8 established domains | NO | High competition; target long-tail variants |
| AI content calendar | Transactional | 1K–10K/mo (Semrush excerpt) | Medium | YES | Transactional intent — write landing page, not blog |
| solo founder AI tools | Informational | 100–1K/mo (indirect signal) | Low | YES | Good cluster anchor |

---

## People Also Ask

**Q: What is agentic AI for solo founders?**
Agentic AI refers to AI systems that take actions over time, not just answer questions.
For solo founders, this means an AI that runs scheduled tasks, drafts content, researches
prospects, and maintains a knowledge base, rather than waiting to be asked each time.

**Q: How do solo founders use AI for content operations?**
Most solo founders start by using AI to write individual pieces of content.
The higher-leverage move is using AI to maintain the content system: the calendar,
the vault of past content, and the through-line between pieces. That's where AI
eliminates coordination overhead rather than just writing time.
```
