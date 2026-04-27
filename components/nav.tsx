"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  CalendarDays,
  Inbox,
  Clock,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";

const items = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/journal", label: "Journal", icon: CalendarDays },
  { href: "/sources", label: "Sources", icon: Inbox },
  { href: "/automations", label: "Automations", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [hermesUp, setHermesUp] = useState<boolean | null>(null);
  const [model, setModel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hermes-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setHermesUp(Boolean(d.running));
          setModel(d.model ?? null);
        }
      })
      .catch(() => setHermesUp(false));
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] p-3 md:hidden dense">
        <Link
          href="/"
          className="font-mono text-xs font-medium tracking-[0.16em] text-[hsl(var(--fg-secondary))] uppercase"
        >
          Console
        </Link>
        <button
          className="dense p-2"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[hsl(var(--bg-page)/0.8)] backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          "border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] dense",
          "md:flex md:w-[220px] md:flex-col md:border-r md:relative",
          open
            ? "fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r"
            : "hidden md:flex",
        )}
      >
        {/* Logo / brand */}
        <div className="hidden md:flex items-center justify-between p-4 pb-3">
          <Link
            href="/"
            className="font-mono text-xs font-medium tracking-[0.18em] text-[hsl(var(--fg-secondary))] uppercase"
          >
            Console
          </Link>
          <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))]">v0.1</span>
        </div>

        {/* Mobile close */}
        {open && (
          <div className="flex items-center justify-between p-4 md:hidden">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-mono text-xs font-medium tracking-[0.18em] text-[hsl(var(--fg-secondary))] uppercase"
            >
              Console
            </Link>
            <button onClick={() => setOpen(false)} className="dense p-1" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded px-3 py-1.5 text-sm transition-colors duration-150",
                  active
                    ? "text-[hsl(var(--fg-primary))] font-medium"
                    : "text-[hsl(var(--fg-dim))] hover:text-[hsl(var(--fg-secondary))]",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[hsl(var(--accent-base))]" />
                )}
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme toggle + Hermes status */}
        <div className="border-t border-[hsl(var(--border-default))] px-3 py-3 mt-2 space-y-2">
          <ThemeToggle className="w-full justify-center" />
          <div className="flex items-center gap-2 px-1">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                hermesUp === null
                  ? "bg-[hsl(var(--fg-dim))]"
                  : hermesUp
                    ? "bg-[hsl(var(--status-ok))] status-pulsing"
                    : "bg-[hsl(var(--status-err))]",
              )}
            />
            <span className="font-mono text-[10px] text-[hsl(var(--fg-dim))] truncate">
              {hermesUp === null ? "checking…" : hermesUp ? "hermes" : "hermes offline"}
            </span>
          </div>
          {model && (
            <div className="ml-3.5 font-mono text-[10px] text-[hsl(var(--fg-dim))] truncate px-1">
              {model}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
