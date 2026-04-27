import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SkillRunner } from "@/components/skills/skill-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPack, type PackId } from "@/lib/packs";
import { getSkill } from "@/lib/skills";
import { getOrCreateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SkillRunPage({
  params,
}: {
  params: Promise<{ pack: string; skill: string }>;
}) {
  const { pack: packParam, skill: skillParam } = await params;
  const pack = getPack(packParam);
  if (!pack) notFound();
  const skill = getSkill(pack.id as PackId, skillParam);
  if (!skill) notFound();
  const token = getOrCreateToken();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <Link
        href={{ pathname: `/skills/${pack.id}` }}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {pack.label} Pack
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{skill.fm.name}</h1>
        <p className="text-sm text-muted-foreground">{skill.fm.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {skill.fm.frequency}
          </Badge>
          {(skill.fm.integrations ?? []).map((it) => (
            <Badge key={it} variant="outline" className="text-[10px]">
              {String(it).replace(/_/g, " ")}
            </Badge>
          ))}
          <Badge
            variant={skill.source === "vault" ? "default" : "muted"}
            className="text-[10px]"
          >
            {skill.source === "vault" ? "your override" : "shipped"}
          </Badge>
        </div>
      </header>

      <SkillRunner skill={skill} token={token} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">How this skill runs</CardTitle>
        </CardHeader>
        <CardContent>
          <article className="markdown-body">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">{skill.body}</pre>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
