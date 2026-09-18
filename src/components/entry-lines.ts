import { entries } from "@/components/entries";

/**
 * Every entry's Talk lines, flattened. Importing this reaches the whole
 * registry, so it belongs only to code that already has it: the collection.
 */
export const ENTRY_LINES: Record<string, string> = Object.assign(
  {},
  ...entries.map((entry) => entry.meta.lines),
);
