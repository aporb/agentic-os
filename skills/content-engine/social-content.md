---
name: social-content
description: Create social media posts from your existing content, research, or ideas.
version: 1.0.0
trigger: "social post", "tweet", "linkedin post", "twitter thread", "write a tweet"
---

# Social Content

Turn ideas, research, or existing content into social media posts. Platform-aware formatting. No AI-speak.

## When to Use

- You need content for Twitter/X, LinkedIn, or other platforms
- You have a blog post or research finding to share
- You have an idea but can't find the right words

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| idea | Yes | The core insight or message |
| platform | No | `twitter`, `linkedin`, `thread` (default: twitter) |
| tone | No | `professional`, `casual`, `provocative` (default: casual) |

## Steps

1. **Find the hook** — What's the one surprising or valuable thing? That's the first line. Not "I've been thinking about..." — start with the insight.
2. **Draft 3 versions**:
   - Version A: Direct, punchy, insight-first
   - Version B: Story or question-first, insight second
   - Version C: Contrarian or provocative take
3. **Format for platform**:
   - **Twitter (single)**: Max 280 chars. One idea. No hashtags unless trending.
   - **LinkedIn**: 1300 chars max. Professional. One clear takeaway. Line breaks for readability.
   - **Thread**: 3-5 tweets. Each tweet = one idea. Last tweet = summary or CTA.
4. **Check for AI voice** — Remove: em-dashes, "game changer", "let that sink in", "hot take", any phrase you'd never say out loud.
5. **Present all versions** — Let the user pick. Don't auto-publish.

## Output

2-3 post versions delivered directly to the user. No file saved — you pick the one you like and post it yourself.

## Pitfalls

- **Boring openers**: "I've been thinking about..." / "Unpopular opinion:" / "Hot take:" — all banned. Just say the thing.
- **Hashtag soup**: On Twitter, zero or one hashtag. On LinkedIn, three max. More looks amateur.
- **No engagement hook**: A statement gets ignored. A question or challenge gets replies. End with something that invites response.
