# Schema

This zone defines the rules the agent follows. The human sets the rules; the agent obeys them.

## Files

| File | Purpose |
|------|---------|
| `agent-protocol.md` | The operating rules. Single source of truth for all agent instruction files. |
| `tags.md` | The tag taxonomy. Only these tags may be used in frontmatter. |
| `templates.md` | Page templates for each zone. Copy, don't invent. |

## Making Changes

Only the human modifies schema files. If the agent discovers a gap or conflict in the schema, it should flag it to the human and wait for resolution.
