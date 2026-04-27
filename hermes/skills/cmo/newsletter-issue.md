---
name: newsletter-issue
description: Draft a full newsletter issue with original commentary and curated links, saved to the vault and queued as a Gmail draft.
version: 1.0.0
trigger:
  - "draft the newsletter"
  - "write this week's newsletter"
  - "newsletter issue"
  - "draft a newsletter"
  - "write the newsletter"
  - "newsletter for this week"
  - "put together the newsletter"
  - "write newsletter issue"
integrations:
  - vault-sqlite-fts5
  - web-search-ddgr-gogcli
  - gmail-draft-create
inputs:
  - name: theme
    description: The topic, question, or through-line the issue should address
    required: true
  - name: issue_number
    description: Issue number for the series (used in the artifact filename and subject line)
    required: false
  - name: format
    description: "Issue structure: 'long-form' (one main essay), 'curated' (commentary + 5–7 links), or 'hybrid' (short essay + 3–4 links). Default: hybrid"
    required: false
  - name: list_name
    description: Name of the newsletter (used in subject line and footer)
    required: false
output_artifact: "wiki/newsletter-[theme-slug].md"
frequency: on-demand-or-cron
pack: cmo
---

## When to run

Thursday afternoon, or the day before your send date. Use it when you know what you want to say this week but the issue still exists only as a note in your vault or a thread in your head.

Also run it when you've fallen behind and need to catch up fast. Give it a theme that's been relevant to your audience this week and it will produce something publishable, not generic.

The output is two things: a vault page you review and edit, and a Gmail draft ready to queue in whatever email platform you export to (Beehiiv, ConvertKit, Substack). The Gmail draft is the portable working copy; your newsletter platform is where it goes live.

## What you'll get

A complete issue in the format you specify: a tight primary section with your original take, curated links with commentary that earns the share, and a subject line with one primary and one alternative. Everything goes through anti-AI-voice rules before it lands in front of you.

The issue reads like you wrote it — because the starting point is what's already in your vault. The agent doesn't invent a voice; it synthesizes from your own notes and sources, then fills in gaps with web research.

## Steps

1. Parse the `theme` input. Extract the core question or claim the issue should address. As with blog posts, push the theme to a specific angle before drafting. "AI tools" is a theme; "most founders use AI to answer questions they should be asking differently" is an angle.

2. Check the vault for prior newsletter issues: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/newsletter-%' ORDER BY updated DESC LIMIT 5;"`. Read the most recent 2–3 issues to capture voice, format patterns, and topics already covered. Don't repeat a topic covered in the last 4 issues.

3. Search the vault for relevant wiki pages matching the theme: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 15) FROM pages WHERE pages MATCH '<theme-keywords>' ORDER BY rank LIMIT 8;"`. Read any directly relevant pages. These are your primary source material.

4. Run web searches for current events, research, or examples relevant to the theme. Use `ddgr` first, fall back to `gogcli`. For a curated or hybrid issue, find 3–5 links worth sharing. A link earns its place only if you can write a 2–3 sentence take that adds value beyond the headline. If the commentary is just "this is interesting," cut the link.

5. Draft the issue body based on the format:
   - **long-form:** one main essay (600–900 words) with the same structure as `blog-post` — argument first, evidence, implication, close.
   - **curated:** brief (100–150 word) framing section that gives the issue a through-line, then 5–7 link items each with 2–3 sentences of original commentary. No link item is "here's a link to [thing]." Each one says what you think about it.
   - **hybrid (default):** 300–500 word main section with the primary argument or update, followed by 3–4 curated links with commentary.

6. Write the subject line. Write two versions:
   - Primary: direct, states the argument or situation. Under 50 characters if possible.
   - Alternative: curiosity-gap variant. No clickbait. No "You won't believe." No question marks stacked.

7. Apply anti-AI-voice rules to the full draft:
   - No em-dashes anywhere. Use commas or periods.
   - No hedging: remove "perhaps," "might," "could help," "you might find," "consider."
   - No corporate jargon: "leverage" (verb), "circle back," "deep dive," "ecosystem," "north star."
   - No stacked rhetorical questions.
   - No "In conclusion" or "Thanks for reading" as a section header. Closing paragraph stands on its own.
   - Active voice throughout. Concrete nouns. Short declarative sentences.
   - The reader should be able to read every sentence at speed and understand it without re-reading.

8. Write the footer: issue number (if provided), list name (if provided), and a one-line "You're getting this because..." statement. Keep it under 30 words.

9. Save the draft to `wiki/newsletter-[theme-slug].md` with `status: draft`.

10. Create a Gmail draft via Gmail MCP. Subject line: the primary subject line from step 6. Body: the issue body formatted as plain text (no markdown headers — use ALL CAPS for section breaks if needed for readability in plain text). Recipients: leave blank (the user adds the list address or imports to their platform).

11. Report back: confirm both artifacts, state the subject line chosen, and flag any claims or links that need the user's verification before send.

## Output format

```yaml
---
type: wiki
title: "[Newsletter Title] — Issue [N]"
created: YYYY-MM-DDT00:00:00
updated: YYYY-MM-DDT00:00:00
status: draft
tags: [newsletter, cmo, <theme-tag>]
sources: [<vault-pages-cited>, <web-urls-cited>]
slug: newsletter-<theme-slug>
issue_number: <N>
subject_line_primary: "<primary subject>"
subject_line_alt: "<alternative subject>"
format: hybrid|long-form|curated
---
```

```markdown
# [Newsletter Title] — Issue [N]

**Subject (primary):** [primary subject line]
**Subject (alt):** [alternative subject line]

---

[Main section — argument or update, 300–500 words for hybrid format]

---

## Worth Reading

**[Link Title](url)**
[2–3 sentences of original commentary. What you think, not just what the article says.]

**[Link Title](url)**
[2–3 sentences of original commentary.]

**[Link Title](url)**
[2–3 sentences of original commentary.]

---

[Footer — issue number, list name, 1-line subscriber context. Under 30 words.]
```

## Example output (truncated)

```markdown
---
type: wiki
title: "The Leverage Letter — Issue 12"
created: 2026-04-28T14:00:00
status: draft
tags: [newsletter, cmo, ai-tools, solo-founders]
slug: newsletter-ai-coordination-overhead
issue_number: 12
subject_line_primary: "Your AI stack is solving the wrong problems"
subject_line_alt: "What founders get backwards about AI tools"
format: hybrid
---

# The Leverage Letter — Issue 12

**Subject (primary):** Your AI stack is solving the wrong problems
**Subject (alt):** What founders get backwards about AI tools

---

Six months ago, you probably started using AI to write faster.
That was the right first step and the wrong stopping point.

The founders getting real distance from AI right now aren't using it
to produce more content. They're using it to eliminate the coordination
overhead that was eating 30–40% of their working week. The writing got
faster too, but that's a side effect, not the win.

Coordination overhead is the real tax: deciding what to write, who it's for,
whether it fits the content calendar, where the research lives, what you already
said in issue 9 that you don't want to repeat. That decision stack is where
most founder-marketing stalls.

## Worth Reading

**[The Hidden Cost of Context-Switching in Solo Operations](https://example.com)**
Research out of UC Irvine puts task-switch recovery time at 23 minutes.
For solo founders, every time you pick up a content task after an email,
you're starting cold. The AI fix isn't writing — it's keeping context alive
between sessions so you don't rebuild it every time.
```
