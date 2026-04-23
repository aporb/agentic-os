Ingest a source file into the wiki.

**Steps:**

1. Run `date +%Y-%m-%d` to get today's date. Use this for all frontmatter fields and filenames.
2. Ask the user which source file to ingest (or use $ARGUMENTS if provided).
2. Read the source file from `/sources/`.
3. Update the source frontmatter `status` to `reading`.
4. Analyze the source content. Identify key concepts, entities, claims, and relationships.
5. For each distinct concept or entity:
   - Check if a wiki page already exists in `/wiki/`.
   - If yes: update the existing page with new information from this source. Add `[[source-filename]]` to the `sources` frontmatter list.
   - If no: create a new wiki page using the appropriate template from `/schema/templates.md`. Set `status: draft`. Add `[[source-filename]]` to the `sources` frontmatter list.
6. Add wikilinks between related wiki pages using `[[page-name]]` syntax.
7. Check for contradictions with existing wiki content. If found, add entries to `/wiki/contradictions.md`.
8. Update the source frontmatter `status` to `processed`.
9. Update `/wiki/index.md` with any new pages created.
10. Commit with message: `ingest: {source-filename}`

**Rules:**
- Do not modify the source file content (only frontmatter status changes).
- Use only tags from `/schema/tags.md`.
- Flag contradictions, don't silently resolve them.
- Every claim in a wiki page must cite its source with `[[source-filename]]`.
