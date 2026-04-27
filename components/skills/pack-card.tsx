import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Pack } from "@/lib/packs";

export function PackCard({ pack, skillCount }: { pack: Pack; skillCount: number }) {
  if (!pack.v1) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <span className="text-xl">{pack.emoji}</span>
              {pack.label}
            </span>
            <Badge variant="muted" className="text-[10px]">
              v2
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{pack.subtitle}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{pack.description}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={{ pathname: `/skills/${pack.id}` }} className="block transition-transform hover:scale-[1.01]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <span className="text-xl">{pack.emoji}</span>
              {pack.label}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {skillCount} skills
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{pack.subtitle}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{pack.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
