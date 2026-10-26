"use client";

import React, { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemeMode = "system" | "light" | "dark";

export function ThemeToggle({
  variant = "button",
  className = "",
}: {
  variant?: "button" | "segmented";
  className?: string;
}) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [resolvedDark, setResolvedDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("color-scheme") as ThemeMode | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else {
        setTheme("system");
      }

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const isDark =
        stored === "dark" || (stored !== "light" && media.matches);
      setResolvedDark(isDark);

      const handleMediaChange = (e: MediaQueryListEvent) => {
        const currentStored = localStorage.getItem("color-scheme");
        if (!currentStored || currentStored === "system") {
          setResolvedDark(e.matches);
          if (e.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      };

      media.addEventListener("change", handleMediaChange);
      return () => media.removeEventListener("change", handleMediaChange);
    } catch {
      // fallback
    }
  }, []);

  const applyTheme = (next: ThemeMode) => {
    setTheme(next);
    try {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (next === "system") {
        localStorage.removeItem("color-scheme");
        if (meta) meta.setAttribute("content", "light dark");
        const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolvedDark(sysDark);
        if (sysDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        localStorage.setItem("color-scheme", next);
        if (meta) meta.setAttribute("content", next);
        const isDark = next === "dark";
        setResolvedDark(isDark);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // ignore
    }
  };

  const toggleNext = () => {
    // 2-state fast toggle for the header button:
    // If currently dark (resolved), switch to light.
    // If currently light (resolved), switch to dark.
    if (resolvedDark) {
      applyTheme("light");
    } else {
      applyTheme("dark");
    }
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`} />
    );
  }

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 ${className}`}
        role="group"
        aria-label="Farbschema wählen"
      >
        <button
          type="button"
          onClick={() => applyTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white dark:bg-slate-900 text-amber-600 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Hell</span>
        </button>
        <button
          type="button"
          onClick={() => applyTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-white dark:bg-slate-900 text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dunkel</span>
        </button>
        <button
          type="button"
          onClick={() => applyTheme("system")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "system"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>System ({resolvedDark ? "Dunkel" : "Hell"})</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleNext}
      aria-label={
        resolvedDark
          ? "Zum hellen Design wechseln"
          : "Zum dunklen Design wechseln"
      }
      title={
        resolvedDark
          ? "Aktuell: Dunkel (Klick für Helles Design)"
          : "Aktuell: Hell (Klick für Dunkles Design)"
      }
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs ${className}`}
    >
      {resolvedDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
