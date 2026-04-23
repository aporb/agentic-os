Research a topic and build wiki pages from findings.

**Steps:**

1. Run `date +%Y-%m-%d` to get today's date. Use this for all frontmatter fields and filenames.
2. Take the user's research topic (or $ARGUMENTS).
2. Search existing `/wiki/` pages for what's already known about this topic.
3. Search `/sources/` for relevant source material (check `status: unread` and `status: reading` first).
4. If sources exist but are unprocessed, run the ingest workflow on each relevant source.
5. If sources are insufficient, ask the user to provide additional sources (articles, URLs, documents) and drop them in `/sources/`.
6. Create or update wiki pages synthesizing the research:
   - Use templates from `/schema/templates.md`.
   - Set `status: draft` on new pages.
   - Add `[[source-filename]]` citations for every claim.
   - Link related wiki pages with `[[page-name]]`.
7. Check for contradictions with existing wiki content. Flag in `/wiki/contradictions.md` if found.
8. Update `/wiki/index.md` with any new pages.
9. Present a summary of findings to the user.
10. Commit with message: `wiki: research-{topic-slug}`

**Rules:**
- Do not fabricate. Only synthesize what sources actually say.
- One concept per wiki page. Split broad topics.
- Use only tags from `/schema/tags.md`.
