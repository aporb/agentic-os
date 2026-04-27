import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";
import type { HermesStatus, HermesSession, HermesCron } from "@/lib/hermes";

export function HermesStatusTile({
  status,
  sessions,
  crons,
}: {
  status: HermesStatus;
  sessions: HermesSession[];
  crons: HermesCron[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Hermes</CardTitle>
        <Cpu className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant={status.running ? "default" : "destructive"} className="text-[10px]">
            {status.running ? "running" : "down"}
          </Badge>
          {status.model && (
            <span className="font-mono text-xs text-muted-foreground">{status.model}</span>
          )}
        </div>

        {sessions.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recent sessions
            </div>
            <ul className="mt-1 space-y-0.5">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.session_id} className="flex justify-between text-xs">
                  <span className="truncate">{s.title ?? s.session_id.slice(0, 8)}</span>
                  <span className="text-muted-foreground">{s.platform}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {crons.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Scheduled
            </div>
            <ul className="mt-1 space-y-0.5">
              {crons.slice(0, 4).map((c) => (
                <li key={c.name} className="flex justify-between text-xs">
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{c.schedule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
