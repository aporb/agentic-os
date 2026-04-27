import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

/**
 * Server component that renders markdown body to safe HTML.
 * Wikilinks `[[page]]` are converted to internal /wiki/ links.
 */
export async function MarkdownView({ body }: { body: string }) {
  // Convert [[wikilinks]] to standard markdown links pointing at /wiki/<slug>
  const withWikilinks = body.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target: string, label?: string) => {
      const slug = target.trim().replace(/\.md$/, "");
      const display = (label ?? target).trim();
      return `[${display}](/wiki/${slug})`;
    },
  );

  const html = String(
    await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(withWikilinks),
  );

  return (
    <article
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
