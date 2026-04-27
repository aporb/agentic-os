---
name: linkedin-post-set
description: Write a week's worth of 5 distinct LinkedIn posts from a single theme, each with a different angle and hook strategy.
version: 1.0.0
trigger:
  - "write linkedin posts"
  - "linkedin post set"
  - "draft linkedin posts"
  - "write my linkedin posts for the week"
  - "linkedin content for the week"
  - "five linkedin posts"
  - "week of linkedin posts"
  - "social posts for linkedin"
integrations:
  - vault-sqlite-fts5
inputs:
  - name: theme
    description: The topic, claim, or story the week's posts should orbit around
    required: true
  - name: audience
    description: Who you're trying to reach — their role, context, and what they care about
    required: true
  - name: tone_notes
    description: Any specific voice notes — e.g. "this week I want to be more direct than usual" or "the audience is technical"
    required: false
output_artifact: "direct delivery (5 posts in response)"
frequency: on-demand
pack: cmo
---

## When to run

Sunday evening or Monday morning, before you start the work week. Five posts gives you one per day with no scramble. You edit before you post — the agent produces the raw material, you refine and schedule.

Also useful mid-week if you hit a moment worth capturing (a deal closed, a hard lesson, something you said in a sales call that resonated). Give it the theme from that moment and it produces a set built around it.

The output is delivered directly in the response, not saved to the vault. LinkedIn posts are ephemeral. Save the ones that perform well manually in `wiki/linkedin-top-posts.md` if you want to build a pattern library.

## What you'll get

Five posts. Not five versions of one post. Each takes a different angle on the theme and uses a distinct hook strategy. You should be able to post all five in a week without them feeling repetitive to a reader who saw each one.

Each post is formatted as a code block with the post text, character count, and a short note on the hook strategy it uses. You edit the code blocks, then copy-paste to LinkedIn or paste into Buffer/Typefully for scheduling.

## Steps

1. Parse the `theme` and `audience` inputs. Map out five distinct angles before writing a single post. A theme of "AI and solo founders" could produce angles like: (a) a contrarian take on a common belief, (b) a specific result or story, (c) a how-to or tactical breakdown, (d) a before/after or problem-solution structure, (e) a short take or observation. Assign one angle per post before writing.

2. Search the vault for relevant context: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 12) FROM pages WHERE pages MATCH '<theme-keywords>' ORDER BY rank LIMIT 8;"`. Read any directly relevant wiki pages. The more the posts can draw on specific things you've done or written, the less they sound like generic LinkedIn content.

3. If `tone_notes` are provided, apply them as constraints on every post. Treat them as hard rules, not suggestions.

4. Write all 5 posts. Enforce these constraints on every post:
   - **Hook (first line):** the first line is the only thing most people see before the "see more" cutoff. It must earn the click. Acceptable hooks: a direct claim, a specific number, a situation statement the reader recognizes. Unacceptable hooks: questions that sound like clickbait, generic observations, sentences that start with "I've been thinking about."
   - **Length:** 150–300 words for most posts. One post in the set can be short (50–100 words) as a deliberate contrast.
   - **Structure:** short paragraphs. 1–3 sentences per paragraph. White space matters on mobile.
   - **No em-dashes.** Use commas and periods to join clauses.
   - **No corporate jargon:** "leverage" (verb), "synergy," "circle back," "deep dive," "ecosystem play," "north star metric," "needle-mover," "scalable solutions."
   - **No hedging:** "perhaps," "might," "could help," "consider," "you might find."
   - **No stacked rhetorical questions.** One question per post maximum, and only if it earns its place.
   - **No "I'm humbled," "Thrilled to announce," "Excited to share."** State things directly.
   - **No "What do you think?" as the only call-to-action.** If you ask a question, make it specific.
   - **No ellipses as a pause device.** Periods end sentences.

5. For each post, document:
   - Character count (LinkedIn's soft limit is 3,000; aim for under 800 for standard posts)
   - Hook strategy used (from the taxonomy below)
   - Suggested day if posting Mon–Fri

6. Hook strategy taxonomy (assign one per post):
   - **Contrarian:** opens with a claim that contradicts the common take on the theme
   - **Specific result:** opens with a concrete outcome, number, or before/after
   - **Situation recognition:** opens with a scenario the reader has been in
   - **Tactical breakdown:** opens with what you're going to show, then delivers step-by-step
   - **Short take:** under 100 words, a single observation or claim that stands alone

7. Do not add hashtags unless the user asks. Hashtags on LinkedIn do not meaningfully improve reach for founder accounts; they add visual noise.

8. Deliver all 5 posts in the response as formatted code blocks, each labeled with the angle, hook strategy, character count, and suggested post day.

## Output format

Each post is delivered as a labeled code block:

```
--- POST 1 of 5 ---
Angle: [angle name]
Hook strategy: Contrarian
Character count: [N]
Suggested day: Monday

[post text exactly as it should appear on LinkedIn,
including paragraph breaks,
but no hashtags unless requested]
```

Followed by:

```
--- POST 2 of 5 ---
Angle: [angle name]
Hook strategy: Specific result
Character count: [N]
Suggested day: Tuesday

[post text]
```

...and so on through Post 5.

## Example output (truncated)

```
--- POST 1 of 5 ---
Angle: Contrarian take on AI tooling advice
Hook strategy: Contrarian
Character count: 312
Suggested day: Monday

Most AI advice is solving the wrong problem.

The goal isn't to write faster. The goal is to stop re-establishing
context every time you sit down to do something.

A solo founder loses 30–40% of their working week not to slow tasks
but to the overhead of deciding: what to work on, where the relevant
context lives, whether this fits the bigger picture.

AI that helps you write faster does nothing about that overhead.
AI that maintains your operating picture — what you're building, who
for, what you said last week — changes the economics of running alone.

That's the difference between a productivity tool and a second brain.
```

```
--- POST 2 of 5 ---
Angle: Specific result from using content calendar + vault
Hook strategy: Specific result
Character count: 278
Suggested day: Tuesday

8 weeks ago I was publishing roughly once a month, reactively,
with no through-line between posts.

Last week I shipped 4 pieces across three channels with a consistent
argument running through all of them. Same working hours. Different system.

The change wasn't discipline. It was eliminating the decision stack.
Every piece now starts from a content calendar that already knows
this week's theme, this week's audience, and what I published last week.

The writing time stayed the same. The overhead before writing went to
near zero.

That's what a second brain actually buys you.
```
