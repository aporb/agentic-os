---
name: blog-post
description: Draft a blog post from a topic or vault notes to publishable quality, saved for review before publishing.
version: 1.0.0
trigger:
  - "write a blog post"
  - "draft a blog post about"
  - "write a post on"
  - "blog post about"
  - "draft a post for"
  - "write something about"
  - "draft an article on"
  - "blog about"
integrations:
  - vault-sqlite-fts5
  - web-search-ddgr-gogcli
  - google-drive-read
inputs:
  - name: topic
    description: The subject, question, or angle the post should address
    required: true
  - name: audience
    description: Who this post is for — their role, what they already know, what they want to walk away with
    required: true
  - name: source
    description: Optional Google Drive file link, vault wiki page slug, or raw notes to anchor the post
    required: false
  - name: word_count
    description: Target word count (default 800–1200 words)
    required: false
output_artifact: "wiki/draft-[slug].md"
frequency: on-demand
pack: cmo
---

## When to run

When you have a topic worth publishing and need to move from "I should write about this" to a reviewable draft. Run it after a client conversation surfaces a pattern you've seen three times, after you've taken a strong position in a Telegram thread, or when you've been meaning to explain something and keep restating it from scratch in every sales call.

Also useful when you have vault notes that are too scattered to publish as-is. Feed the wiki page slug as `source` and the skill turns research-mode thinking into a shaped argument.

The output lands at `wiki/draft-[slug].md` with `status: draft`. It does not publish anywhere. You review it, edit it, then decide whether it goes to your newsletter, LinkedIn, or site.

## What you'll get

A publish-ready draft with a specific argument, evidence from the web and your vault, and a clean structure that doesn't rely on AI filler. The draft includes inline `[[source-filename]]` citations for every factual claim, so you can trace the reasoning before you put your name on it.

The writing follows strict anti-AI-voice rules. No em-dashes. No hedging. No corporate verbs. Short declarative sentences. It reads like a practitioner wrote it, not like a language model tidied up a content brief.

## Steps

1. Parse the `topic` and `audience` inputs. Identify: what is the specific claim or argument this post should make? A topic is not an argument. If the topic is "AI and solo founders," the argument might be "most solo founders underestimate AI because they're thinking about tasks, not coordination overhead." Push the topic to a falsifiable claim before writing anything.

2. Scan the vault for relevant existing material: run `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 20) FROM pages WHERE pages MATCH '<topic-keywords>' ORDER BY rank LIMIT 10;"`. Read any high-relevance wiki pages in full. Note which vault pages contain source material; you will cite them as `[[filename]]` inline.

3. If `source` is provided as a vault slug, read that page in full. If it is a Google Drive file link, read the file via Google Drive MCP. Extract the key claims and facts — these anchor the post's evidence base.

4. Run web searches to fill evidence gaps. Use `ddgr` first; fall back to `gogcli` if fewer than 5 results return. Search for: (a) concrete data or statistics supporting the argument, (b) counterarguments worth addressing, (c) recent examples or case studies. Do not use search results as filler. Each web source you incorporate earns an inline link in the draft.

5. Build the post structure:
   - **Opening:** one or two sentences that name the problem or situation the reader is already in. No rhetorical questions. No "In a world where..." No "Have you ever wondered." Drop the reader into the situation.
   - **The argument:** state the main claim directly in the first 150 words. Readers should know what you're arguing before they decide to keep reading.
   - **Evidence/body:** 2–4 sections, each with a sub-heading. Each section makes one supporting point with at least one concrete example, data point, or vault-sourced claim.
   - **Implication:** what does the argument mean in practice? What does the reader do differently after reading this?
   - **Close:** one paragraph. No "In conclusion." No "Final thoughts." Restate the argument in a new way or give the reader a single concrete next step.

6. Apply anti-AI-voice rules throughout the draft:
   - No em-dashes. Use commas and periods to join clauses.
   - No hedging: remove "might," "could," "perhaps," "consider," "we think," "you might find," "it's possible that."
   - No corporate verbs: "leverage" (as a verb), "circle back," "deep dive," "unpack," "ideate," "socialize."
   - No stacked rhetorical questions.
   - No "In conclusion," "In summary," "To wrap up," "Final thoughts."
   - No ellipses used as a dramatic pause.
   - Every sentence should survive deletion. If removing it changes nothing, remove it.
   - Active voice. Concrete nouns. Short sentences. The reader should never have to re-read a sentence to understand it.

7. Add inline `[[source-filename]]` citations next to every factual claim that comes from a vault page. For web sources, add an inline hyperlink immediately after the claim. Do not batch citations at the end — they live next to the claim or the reader can't find them.

8. Write the frontmatter block and save to `wiki/draft-[slug].md` where the slug is a kebab-cased 3–5-word version of the post title.

9. Report back: confirm the file path, give a one-sentence summary of the post's main argument, and flag any claims you couldn't find solid evidence for. The user decides whether those claims stay, get softened, or get cut.

## Output format

```yaml
---
type: wiki
title: "[Post Title]"
created: YYYY-MM-DDT00:00:00
updated: YYYY-MM-DDT00:00:00
status: draft
tags: [blog, cmo, <topic-tag>]
sources: [<vault-pages-cited>, <web-urls-cited>]
slug: <kebab-slug>
audience: <audience-from-input>
word_count: <actual-word-count>
---
```

```markdown
# [Post Title]

[Opening — 1–2 sentences dropping the reader into the situation]

[Main argument stated directly in first 150 words]

## [Section heading — one supporting point]

[Evidence, concrete example, or vault-sourced claim with [[citation]]]

## [Section heading — one supporting point]

[Evidence, concrete example, data point with link or [[citation]]]

## [Section heading — implication or counterargument addressed]

[What this means in practice]

[Closing paragraph — no "in conclusion," restate the argument or give one concrete next step]
```

## Example output (truncated)

```markdown
---
type: wiki
title: "Solo Founders Don't Have a Marketing Problem. They Have a Coordination Tax."
created: 2026-04-28T09:00:00
updated: 2026-04-28T09:00:00
status: draft
tags: [blog, cmo, marketing, solo-founders]
sources: [wiki/icp-current.md, wiki/content-calendar-2026-04.md]
slug: solo-founders-coordination-tax
audience: solo founders at $100K–$1M ARR who publish inconsistently
word_count: 1050
---

# Solo Founders Don't Have a Marketing Problem. They Have a Coordination Tax.

Most solo founders at $200K ARR publish roughly four pieces of content per year.
Not because they don't have things to say. Because every piece of content requires
a decision tree they have to rebuild from scratch each time.

The real cost isn't writing time. It's the overhead of deciding what to write,
who it's for, and whether it fits into a coherent body of work. That overhead
compounds. By the time a founder sits down to write, half the session is spent
re-establishing context that should already exist.

## The coordination tax is invisible until you measure it

A founder I know runs a $400K ARR B2B data business. He estimates he spends
45 minutes deciding what to write before he writes a single word. Over 12 months,
that's roughly 20 hours of decision overhead for content that never shipped. [[wiki/coordination-overhead-research.md]]
```
