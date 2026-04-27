import { hermes } from "@/lib/hermes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const crons = await hermes().listCrons();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Scheduled runs registered with Hermes' cron scheduler. Read-only here in v1 —
          register new crons via <code>/agentic-os</code> bridge commands or the Hermes CLI.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Scheduled ({crons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No automations yet. The default install registers <code>vault-index-sync</code> and{" "}
              <code>daily-standup</code>; if you don't see them, run <code>/agentic-os doctor</code>.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {crons.map((c) => (
                <li key={c.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.last_status && (
                        <Badge
                          variant={c.last_status === "ok" ? "default" : c.last_status === "silent" ? "muted" : "destructive"}
                          className="text-[10px]"
                        >
                          {c.last_status}
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{c.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5">{c.schedule}</code>
                    <span>→ {c.delivery}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
