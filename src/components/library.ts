import type { ComponentType } from "react";
import type { ComponentMeta, SwitchState } from "./meta";

/**
 * The shelves of the library, in the order the index lists them.
 *
 * A category stays on the rail whether or not anything is filed under it
 * yet: the library is open and grows, so an empty shelf is a real state
 * rather than a gap to hide.
 */
export const CATEGORIES = [
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "sliders", label: "Sliders" },
  { id: "cursor", label: "Cursor" },
  { id: "buddies", label: "Cursor buddies" },
  { id: "navigation", label: "Navigation" },
  { id: "feedback", label: "Feedback" },
  { id: "experiments", label: "Experiments" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/** A component, the id it is addressed by, and the documentation it ships with. */
export type LibraryEntry = {
  id: string;
  component: ComponentType<{ switches: SwitchState }>;
  meta: ComponentMeta;
};

export type LibrarySection = {
  id: CategoryId;
  label: string;
  entries: LibraryEntry[];
};

/** Files every entry under its category, keeping declared order on both axes. */
export function buildLibrary(entries: LibraryEntry[]): LibrarySection[] {
  return CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    entries: entries.filter((entry) => entry.meta.category === category.id),
  }));
}

/** The index range a section covers: `01 — 06`, `01`, or nothing at all. */
export function formatRange(count: number): string {
  if (count < 1) return "";
  const last = String(count).padStart(2, "0");
  return count === 1 ? last : `01 — ${last}`;
}
