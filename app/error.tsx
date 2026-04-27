"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[agentic-os]", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Something broke</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The Console hit an error rendering this page. Hermes might not be
            reachable, or your vault might be in a state the app didn&apos;t expect.
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
          <p className="text-xs text-muted-foreground">
            Try{" "}
            <code className="rounded bg-muted px-1">/agentic-os doctor</code>{" "}
            from Hermes for a full health check, or check{" "}
            <code className="rounded bg-muted px-1">~/.hermes/agentic-os/server.log</code>.
          </p>
          <Button onClick={reset}>Retry</Button>
        </CardContent>
      </Card>
    </div>
  );
}
