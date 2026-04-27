"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "dense inline-flex h-7 items-center justify-center gap-1.5 rounded px-2 text-[10px] font-medium",
        "border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))]",
        "text-[hsl(var(--fg-secondary))] transition-colors hover:text-[hsl(var(--fg-primary))]",
        className,
      )}
    >
      {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
