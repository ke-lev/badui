"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { RadioDot } from "@/components/sidekick/radio-dot";
import sidekickStyles from "@/components/sidekick/sidekick.module.css";
import styles from "./theme.module.css";
import { isTheme, THEME_STORAGE_KEY as STORAGE_KEY, type Theme } from "./theme-script";

const SYSTEM_DARK = "(prefers-color-scheme: dark)";

// Same external-store shape as the sidekick mode: storage is read once, and a
// later storage failure can't erase a choice already made on this page.
const listeners = new Set<() => void>();
let storedTheme: Theme | null = null;
let storageRead = false;

function readStored(): Theme | null {
  if (!storageRead) {
    storageRead = true;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (isTheme(value)) storedTheme = value;
    } catch {
      // Storage unavailable; follow the system.
    }
  }
  return storedTheme;
}

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(SYSTEM_DARK);
  listeners.add(listener);
  query.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", listener);
  };
}

function getSnapshot(): Theme {
  return readStored() ?? (window.matchMedia(SYSTEM_DARK).matches ? "dark" : "light");
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  storedTheme = next;
  storageRead = true;
  document.documentElement.setAttribute("data-theme", next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable; the choice lasts for this page only.
  }
  listeners.forEach((listener) => listener());
}

const OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeControl() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Strict Mode's dev remount resets <html> to its JSX attributes, dropping
  // the one THEME_SCRIPT set. A no-op in production.
  useLayoutEffect(() => {
    const stored = readStored();
    if (stored) document.documentElement.setAttribute("data-theme", stored);
  }, []);

  return (
    <fieldset className={styles.control}>
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map((option) => (
        <label className={sidekickStyles.option} key={option.value} data-sidekick={`theme-${option.value}`}>
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => setTheme(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
      <RadioDot value={theme} />
    </fieldset>
  );
}
