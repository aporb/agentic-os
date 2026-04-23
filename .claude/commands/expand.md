Deepen a wiki page by expanding it from source material.

**Steps:**

1. Run `date +%Y-%m-%d` to get today's date. Use this for all frontmatter `updated` fields.
2. Ask the user which wiki page to expand (or use $ARGUMENTS if provided).
2. Read the wiki page. Note its current `sources` frontmatter — these are the sources already synthesized.
3. Search `/sources/` for additional sources relevant to this page's topic that are NOT already cited.
   - Check `status: processed` sources that weren't included.
   - Check `status: unread` sources that might be relevant.
4. If relevant unread sources exist, ask the user whether to ingest them first.
5. If relevant processed sources exist:
   - Read each source.
   - Extract new information not yet in the wiki page.
   - Update the wiki page with the new information.
   - Add `[[source-filename]]` to the `sources` frontmatter list.
   - Add new wikilinks to related pages.
6. Check for contradictions with existing page content. Flag in `/wiki/contradictions.md` if found.
7. Do not change the page status. If it was `draft`, it stays `draft`. If it was `reviewed` or `stable`, **stop and ask the user for permission** before modifying.
8. Commit with message: `wiki: expand-{page-name}`

**Rules:**
- Never modify a `reviewed` or `stable` page without explicit user permission.
- Every new claim must cite its source.
- Flag contradictions, don't silently resolve them.
