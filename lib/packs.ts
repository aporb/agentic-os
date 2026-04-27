/**
 * Pack metadata — UI labels and ordering for the v1 skill packs.
 *
 * Internal directory IDs stay stable (ceo/cro/cmo). UI labels are
 * customer-facing per spec §10 and skill-pack-design §6. "Revenue" is
 * deliberately used over "Sales" to match the broader revenue-ops
 * vocabulary the target customer searches with.
 */

export type PackId = "ceo" | "cro" | "cmo" | "cpo" | "cto" | "caio" | "cfo";

export type Pack = {
  id: PackId;
  label: string;
  subtitle: string;
  description: string;
  emoji: string;
  v1: boolean;
};

export const PACKS: Pack[] = [
  {
    id: "ceo",
    label: "CEO",
    subtitle: "Strategy & Ops",
    description:
      "Weekly review, daily standup, meeting prep, competitor research, strategic decisions, investor updates, OKR tracking.",
    emoji: "◎",
    v1: true,
  },
  {
    id: "cro",
    label: "Revenue",
    subtitle: "Pipeline & Customers",
    description:
      "Prospect research, cold outreach, follow-up sequences, sales call prep, proposals, pipeline health, win-loss analysis.",
    emoji: "↗",
    v1: true,
  },
  {
    id: "cmo",
    label: "Marketing",
    subtitle: "Content & Brand",
    description:
      "Blog drafts, newsletters, LinkedIn, content calendars, SEO keyword research, case studies.",
    emoji: "✦",
    v1: true,
  },
  {
    id: "cpo",
    label: "Product",
    subtitle: "Build & Ship",
    description:
      "Feature specs, user feedback synthesis, backlog prioritization, sprint planning, release notes, bug triage, roadmap narrative.",
    emoji: "◇",
    v1: true,
  },
  {
    id: "cto",
    label: "Engineering",
    subtitle: "Code & Infrastructure",
    description:
      "Technical specs, code review, security review, dependency audits, architecture decisions, infrastructure cost audits, post-mortems.",
    emoji: "⚙",
    v1: true,
  },
  {
    id: "caio",
    label: "AI Ops",
    subtitle: "Automation & Agents",
    description:
      "AI stack audits, agent workflow design, skill authoring, prompt library, model benchmarking, vendor research, cost optimization.",
    emoji: "✺",
    v1: true,
  },
  {
    id: "cfo",
    label: "Finance",
    subtitle: "Runway & Pricing",
    description:
      "Monthly financial summaries, unit economics, pricing strategy, investor metrics, expense audits, runway scenarios, tax prep.",
    emoji: "$",
    v1: true,
  },
];

export const V1_PACKS: Pack[] = PACKS.filter((p) => p.v1);

export function getPack(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}
