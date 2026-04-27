import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConfig } from "@/lib/config";
import { checkForUpdate } from "@/lib/updater";
import { searchToolsAvailable } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cfg = getConfig();
  const update = await checkForUpdate();
  const tools = searchToolsAvailable();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Read-mostly view of the Console's runtime configuration.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Runtime config</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5 text-sm">
              <Row k="Vault" v={cfg.vault_path} />
              <Row k="Host" v={`${cfg.host}:${cfg.port}`} />
              <Row k="Agent name" v={cfg.agent_name} />
              <Row k="Hermes API" v={cfg.hermes_api_url} />
              <Row k="Install ID" v={cfg.install_id} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Current" v={update.current_version} />
            <Row k="Latest" v={update.latest_version ?? "(unknown)"} />
            {update.update_available && (
              <Badge variant="default" className="text-[10px]">
                Update available — run <code className="ml-1">/agentic-os update</code>
              </Badge>
            )}
            {!update.update_available && update.latest_version && (
              <Badge variant="muted" className="text-[10px]">Up to date</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Search tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="ddgr" v={tools.ddgr ? "installed" : "missing"} />
            <Row k="gogcli" v={tools.gogcli ? "installed" : "missing"} />
            {!tools.ddgr && !tools.gogcli && (
              <p className="text-xs text-muted-foreground">
                Web-search skills will fall back to the Hermes browser tool.
                Install <code>ddgr</code> (DuckDuckGo CLI) and <code>gogcli</code> (Google CLI)
                for fastest, no-API-key search.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Auth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Token-based localhost auth. Token lives at <code>~/.hermes/agentic-os/token</code>.
              Rotate by deleting the file and restarting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </div>
  );
}
