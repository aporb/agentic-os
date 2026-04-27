import type { PackId } from "@/lib/packs";

/**
 * Pack icon glyphs — geometric SVG, 24×24, currentColor.
 * Replaces emoji to read as a serious tool, not a consumer app.
 */
export function PackGlyph({ pack, className }: { pack: PackId; className?: string }) {
  switch (pack) {
    case "ceo":
      // Diamond — strategic overview
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l8 9-8 9-8-9 8-9z" />
        </svg>
      );
    case "cro":
      // Diagonal arrow — pipeline trajectory
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 19L19 5" />
          <path d="M9 5h10v10" />
        </svg>
      );
    case "cmo":
      // Pulse circle — broadcast
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="8" opacity="0.4" />
        </svg>
      );
    case "cpo":
      // Hexagon — build
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        </svg>
      );
    case "cto":
      // Brackets — code
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5l-6 7 6 7" />
          <path d="M15 5l6 7-6 7" />
        </svg>
      );
    case "caio":
      // Six-point star — meta agent
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12 3v18M3 7.5l18 9M3 16.5l18-9" />
        </svg>
      );
    case "cfo":
      // Bar chart ascending — runway
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 19V13M12 19V8M19 19V5" />
        </svg>
      );
  }
}
