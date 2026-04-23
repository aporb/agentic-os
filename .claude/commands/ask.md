Answer a question using the wiki's synthesized knowledge.

**Steps:**

1. Take the user's question (or $ARGUMENTS).
2. Search `/wiki/` for relevant pages using wikilink references, tags, and content matching.
3. Also check `/sources/` with `status: processed` for context the wiki may not yet synthesize.
4. Synthesize an answer from existing wiki pages. Cite each wiki page used with `[[page-name]]`.
5. If the answer is incomplete or the wiki has gaps:
   - State what you know.
   - State what's missing.
   - Suggest which sources might fill the gap, or suggest the user run `/research` to investigate further.
6. Do not fabricate information. If the wiki doesn't contain the answer, say so.

**Rules:**
- Only use information from `/wiki/` and `/sources/`. No external knowledge unless explicitly allowed.
- Cite your sources within the answer.
- If you find contradictory information, reference `/wiki/contradictions.md`.
