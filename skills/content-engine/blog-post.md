---
name: blog-post
description: Draft a blog post from your knowledge base or a topic you specify.
version: 1.0.0
trigger: "write a blog post", "draft an article", "blog about", "article about"
---

# Blog Post

Draft a blog post or article from research, notes, or your knowledge base. Produces clean, publishable copy that doesn't sound like AI wrote it.

## When to Use

- You need a blog post for your company site
- You want to turn your knowledge into publishable content
- You have notes or research that should become an article

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| topic | Yes | What the post is about |
| audience | No | Who's reading: `founders`, `technical`, `investors`, `customers` (default: founders) |
| length | No | Target word count (default: 800-1200) |
| source | No | Wiki page or file to base it on (if empty, research from scratch) |

## Steps

1. **Check the vault** — Search `wiki/` and `sources/` for existing material on this topic. If there's good stuff, use it. Don't research from scratch if you already know the answer.
2. **Find the hook** — What's the one thing most people get wrong about this? What's the contrarian take? What's the hard-won lesson? That's your opening.
3. **Outline** — 4-6 sections. Each section makes ONE point. No section should be longer than 200 words.
4. **Write the draft** — Rules for non-AI-sounding copy:
   - Short sentences. Mix lengths, but mostly short.
   - Specific examples, not generic advice
   - Say "you" not "one" or "individuals"
   - No em-dashes (—) — they're the AI tell
   - No phrases like "game changer", "leverage", "delve into", "it's worth noting"
   - If a sentence sounds like a LinkedIn influencer wrote it, rewrite it
5. **Cut 20%** — Read through and delete everything that doesn't add information. Every sentence earns its place or it goes.
6. **Save** — Write to `wiki/draft-[topic-slug].md`

## Output

**File**: `wiki/draft-[topic-slug].md`

A polished draft ready for review. Not ready to publish — you still need to read it and add your voice.

## Pitfalls

- **AI voice is obvious**: The #1 risk. If you read it and think "this could have been written by anyone," it needs rewriting. Add specific stories, hot takes, and personality.
- **Too broad**: "How to start a business" is a book, not a blog post. Narrow to one specific insight.
- **No point**: Every post needs ONE thesis. If you can't state it in one sentence, the post isn't focused enough.
