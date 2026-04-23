Create or update today's journal entry.

**Steps:**

1. Run `date +%Y-%m-%d` to get today's date. Use this for the filename and frontmatter.
2. Check if `/journal/YYYY-MM-DD.md` already exists.
3. If it exists: read it for context. Do not modify it.
4. If it doesn't exist: create it using the journal template from `/schema/templates.md`.
   - Set frontmatter: `type: journal`, `title: "YYYY-MM-DD"`, `created: YYYY-MM-DD`, `tags: [journal]`.
   - Add section headers the human can fill in:
     ```
     ## Focus
     
     ## Notes
     
     ## Tomorrow
     ```
5. Do not write journal content. The human owns the journal.
6. Commit with message: `journal: YYYY-MM-DD`

**Rules:**
- The agent never modifies an existing journal entry.
- The agent only creates the scaffold. The human fills in the content.
- Journal entries are for the human's thinking, not the agent's synthesis.
