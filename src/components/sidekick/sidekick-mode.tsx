"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type SidekickMode = "dom" | "talk" | "off";

export const DEFAULT_MODE: SidekickMode = "dom";
const STORAGE_KEY = "badui:sidekick-mode";

function isMode(value: unknown): value is SidekickMode {
  return value === "dom" || value === "talk" || value === "off";
}

type SidekickModeValue = {
  mode: SidekickMode;
  setMode: (next: SidekickMode) => void;
};

const SidekickModeContext = createContext<SidekickModeValue>({
  mode: DEFAULT_MODE,
  setMode: () => {},
});

// A minimal external store lets the mode sync from localStorage after mount
// via useSyncExternalStore, which is the SSR-safe, hydration-mismatch-free
// primitive for reading a client-only data source (react-hooks lint's
// set-state-in-effect rule flags the equivalent read-in-a-useEffect pattern
// as a cascading-render risk and points here instead). memoryMode caches the
// value once read so a later storage failure can't erase a choice already
// made in this page's lifetime.
const listeners = new Set<() => void>();
let memoryMode: SidekickMode | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SidekickMode {
  if (memoryMode === null) {
    try {
      let stored = window.localStorage.getItem(STORAGE_KEY);
      // The mode was called "snark" before it was renamed.
      if (stored === "snark") stored = "talk";
      memoryMode = isMode(stored) ? stored : DEFAULT_MODE;
    } catch {
      memoryMode = DEFAULT_MODE;
    }
  }
  return memoryMode;
}

function getServerSnapshot(): SidekickMode {
  return DEFAULT_MODE;
}

function setMode(next: SidekickMode) {
  memoryMode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable; the choice lasts for this page only.
  }
  listeners.forEach((listener) => listener());
}

export function SidekickModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <SidekickModeContext value={{ mode, setMode }}>{children}</SidekickModeContext>
  );
}

export function useSidekickMode(): SidekickModeValue {
  return useContext(SidekickModeContext);
}
