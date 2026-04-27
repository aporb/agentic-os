import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";

export type StandupBrief = {
  date: string;
  done: string[];
  doing: string[];
  blocked: string[];
  watch: string[];
  source?: "cached" | "fresh" | "missing";
};

export function StandupTile({ brief }: { brief: StandupBrief | null }) {
  if (!brief) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's standup
          </CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No standup yet. Run the <code className="text-xs">daily-standup</code>{" "}
            skill to generate one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          Today's standup
          {brief.source === "cached" && (
            <Badge variant="muted" className="text-[10px]">
              cached
            </Badge>
          )}
        </CardTitle>
        <span className="text-xs text-muted-foreground">{brief.date}</span>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Section label="Done" items={brief.done} accent="text-emerald-500" />
        <Section label="Doing" items={brief.doing} accent="text-blue-400" />
        <Section label="Blocked" items={brief.blocked} accent="text-red-400" />
        <Section label="Watch" items={brief.watch} accent="text-amber-400" />
      </CardContent>
    </Card>
  );
}

function Section({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>{label}</div>
      <ul className="mt-1 space-y-0.5 text-foreground/90">
        {items.map((item, i) => (
          <li key={i} className="leading-snug">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
