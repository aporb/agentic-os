# Sources

Raw materials — the input layer of your Second Brain.

## What Goes Here

- Articles and blog posts (saved as markdown)
- Academic papers (markdown summary + PDF reference)
- Transcripts (meeting notes, podcast transcripts)
- Screenshots and exported data (converted to markdown)
- Any external information you want the agent to synthesize

## Rules

- **Agent reads, never writes.** Files here are immutable once created.
- Every file needs frontmatter. Copy `_template.md` as a starting point.
- Source status tracks processing: `unread → reading → processed`.
- File naming: use lowercase, hyphens, descriptive. Example: `2024-ai-agents-survey.md`.

## Frontmatter

```yaml
---
type: source
title: "Descriptive Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_url: "https://..."
author: "Name or Organization"
status: unread | reading | processed
tags: [tag1, tag2]
---
```

## Workflow

1. Drop a source file here.
2. Run `/ingest` (Claude Code) or tell your agent to process it.
3. The agent reads the source, updates status, creates wiki pages.
4. Status moves to `processed` when fully synthesized.
