import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/lib/skills";

export function SkillCard({ skill }: { skill: Skill }) {
  const integrations = skill.fm.integrations ?? [];
  const isCron = skill.fm.frequency?.startsWith("cron:");
  return (
    <Link
      href={{ pathname: `/skills/${skill.pack}/${skill.fm.name}` }}
      className="block transition-transform hover:scale-[1.005]"
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm">{skill.fm.name}</CardTitle>
            <div className="flex flex-shrink-0 gap-1">
              {skill.source === "vault" && (
                <Badge variant="default" className="text-[10px]">
                  yours
                </Badge>
              )}
              {isCron && (
                <Badge variant="muted" className="text-[10px]">
                  scheduled
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {skill.fm.description}
          </p>
          {integrations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {integrations.slice(0, 3).map((it) => (
                <Badge key={it} variant="outline" className="text-[10px]">
                  {String(it).replace(/_/g, " ")}
                </Badge>
              ))}
              {integrations.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{integrations.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
