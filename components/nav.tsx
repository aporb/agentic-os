"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
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

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-background p-3 md:hidden">
        <Link href="/" className="font-semibold tracking-tight">
          Agentic OS
        </Link>
        <button
          className="p-2 dense"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          "border-border bg-background dense md:flex md:w-56 md:flex-col md:border-r",
          open ? "flex flex-col border-b" : "hidden",
        )}
      >
        <div className="hidden p-4 md:block">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Agentic OS
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Console</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
