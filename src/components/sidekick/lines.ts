import { inspect } from "./inspect";

/** Everything the cursor companion envelopes. Each of these needs a line. */
export const TARGETS =
  'a[href], button, input, select, textarea, [role="slider"], [role="dialog"], [data-sidekick]';

/** Lines for the frame's own controls. A component's lines live in its `meta.lines`. */
export const FRAME_LINES: Record<string, string> = {
  "copy-prompt": "Everything it needs to happen again.",
  reset: "The only control here that does what it says.",
  "skip-link": "Skipping ahead. Understandable.",
  home: "Back to the start. It is not far.",
  github: "Where the source lives.",
  "back-to-top": "Up. Pretty self-explanatory.",
  "sidekick-dom": "Facts only. No personality.",
  "sidekick-talk": "You are already here.",
  "sidekick-off": "...",
  "theme-light": "Lights on.",
  "theme-dark": "Same collection, less light.",
  enter: "Go on, then.",
  "rail-toggle": "A list, folded.",
  "rail-category": "Ummm...",
  "rail-entry": "...",
  "open-entry": "Same thing, more room.",
};

/**
 * An entry's lines still live in its `meta`, but reading them from here would
 * put all thirty implementations and their reproduction prompts in the root
 * client's bundle, which every page loads. The collection owns those entries
 * already, so it hands the flattened map over when it loads and the splash
 * never pulls them in.
 */
let entryLines: Record<string, string> = {};

export function registerEntryLines(lines: Record<string, string>): void {
  entryLines = lines;
}

/** The bespoke line for an element, or undefined when it has none. */
export function bespokeLine(el: Element): string | undefined {
  const key = el.closest("[data-sidekick]")?.getAttribute("data-sidekick");
  if (!key) return undefined;
  if (Object.hasOwn(FRAME_LINES, key)) return FRAME_LINES[key];
  return Object.hasOwn(entryLines, key) ? entryLines[key] : undefined;
}

export function line(el: Element): string {
  return bespokeLine(el) ?? inspect(el);
}
