import { entries } from "@/components/entries";
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

const LINES: Record<string, string> = Object.assign(
  {},
  FRAME_LINES,
  ...entries.map((entry) => entry.meta.lines),
);

/** The bespoke line for an element, or undefined when it has none. */
export function bespokeLine(el: Element): string | undefined {
  const key = el.closest("[data-sidekick]")?.getAttribute("data-sidekick");
  return key && Object.hasOwn(LINES, key) ? LINES[key] : undefined;
}

export function line(el: Element): string {
  return bespokeLine(el) ?? inspect(el);
}
