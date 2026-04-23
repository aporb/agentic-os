# Templates

Page templates for each zone. Copy the relevant template when creating a new page.

## Source Template

Located at `/sources/_template.md`.

## Wiki Templates

### Concept Page

```markdown
---
type: wiki
title: ""
created: {date}
updated: {date}
sources: []
status: draft
tags: []
---

# {Title}

## Summary

{One-paragraph synthesis.}

## Key Points

- 

## Details

{Expanded synthesis from sources.}

## Open Questions

- 

## Related

- [[]]
```

### Entity Page

```markdown
---
type: wiki
title: ""
created: {date}
updated: {date}
sources: []
status: draft
tags: []
---

# {Entity Name}

## Overview

{Who/what they are, in 2-3 sentences.}

## Key Facts

| Field | Value |
|-------|-------|
| Type |  |
| Founded |  |
| Location |  |
| Sector |  |

## Timeline

- **{Date}**: {Event}

## Relationships

- [[]]

## Notes

{Synthesized observations from sources.}
```

### Source Index Page

```markdown
---
type: wiki
title: "Source Index"
created: {date}
updated: {date}
sources: []
status: stable
tags: [reference]
---

# Source Index

| Source | Status | Ingested | Wiki Pages |
|--------|--------|----------|------------|
| [[]] | unread | - | - |
```

## Journal Template

Located at `/journal/_template.md`.

---

**The agent uses these templates when creating pages.** The human may modify templates at any time. The agent should check for the latest version before creating a new page.
