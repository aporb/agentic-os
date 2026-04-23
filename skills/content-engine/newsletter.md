---
name: newsletter
description: Draft a newsletter issue from your recent content, research, or curated links.
version: 1.0.0
trigger: "newsletter", "email newsletter", "weekly email", "curated links"
---

# Newsletter

Draft a newsletter issue — curated links, original commentary, or a mix of both. Formatted for email.

## When to Use

- You need to send a weekly or monthly newsletter
- You want to curate interesting links for your audience
- You have recent blog posts or research to share

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| theme | Yes | The theme or focus for this issue |
| format | No | `curated` (links + commentary), `original` (one essay), `mixed` (default: mixed) |
| length | No | Target word count (default: 500-800) |

## Steps

1. **Gather material** — Check `wiki/` and `sources/` for recent research, drafts, or content. Search the web for timely links related to the theme.
2. **Structure the issue**:
   - **Subject line**: 6-10 words. Promise a specific benefit.
   - **Opening**: 2-3 sentences. Why this matters today.
   - **Body**: 3-5 sections depending on format. Each section = one idea or link with your commentary.
   - **Closing**: One question or call to action.
3. **Write in your voice** — Same anti-AI rules as the blog post skill. If it sounds like a corporate newsletter, rewrite it.
4. **Save** — Write to `wiki/newsletter-[theme-slug].md`

## Output

**File**: `wiki/newsletter-[theme-slug].md`

## Pitfalls

- **Link dump**: A newsletter with 10 links and no commentary is spam. Every link gets your take — why it matters, what you agree/disagree with.
- **Too long**: People scan newsletters. Keep sections under 150 words. Use headers and bullet points.
- **Boring subject lines**: "Weekly Update #14" is not a subject line. "The one thing most founders get wrong about pricing" is.
