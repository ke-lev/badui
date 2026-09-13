import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { entries } from "./entries";
import type { LibraryEntry } from "./library";
import { FRAME_LINES, TARGETS } from "./sidekick/lines";

// The first render only: keys that appear after interaction, such as an
// opened dialog's close button, are not reached here.
function render(entry: LibraryEntry): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(entry.component, { switches: {} }));
  return host;
}

function renderedKeys(entry: LibraryEntry): string[] {
  const keyed = render(entry).querySelectorAll("[data-sidekick]");
  return [...new Set(Array.from(keyed, (el) => el.getAttribute("data-sidekick") ?? ""))];
}

describe.each(entries)("$id", (entry) => {
  it("ships a portable reproduction prompt", () => {
    expect(entry.meta.prompt.trim()).not.toBe("");
    for (const section of [
      "What to build",
      "Markup and semantics",
      "Behavior",
      "Styling",
      "Done when",
    ]) {
      expect(entry.meta.prompt.toLowerCase(), section).toContain(section.toLowerCase());
    }
    expect(entry.meta.prompt).toContain(
      "Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.",
    );
    for (const repoText of ["@/", "var(--", "data-sidekick", "ComponentMeta", "badui"]) {
      expect(entry.meta.prompt, repoText).not.toContain(repoText);
    }
  });

  it("declares at least one Talk line, none of them empty", () => {
    const lines = Object.entries(entry.meta.lines);
    expect(lines.length).toBeGreaterThan(0);
    for (const [key, text] of lines) expect(text.trim(), key).not.toBe("");
  });

  it("renders at least one element the cursor companion can key on", () => {
    expect(renderedKeys(entry)).not.toEqual([]);
  });

  it("has a Talk line for every key it renders", () => {
    const declared = Object.keys(entry.meta.lines);
    for (const key of renderedKeys(entry)) expect(declared).toContain(key);
  });

  it("keys every element the cursor companion envelops", () => {
    const declared = Object.keys(entry.meta.lines);
    for (const el of render(entry).querySelectorAll(TARGETS)) {
      const key = el.closest("[data-sidekick]")?.getAttribute("data-sidekick");
      expect(declared, el.outerHTML.slice(0, 80)).toContain(key);
    }
  });

  // Switches are drawn by the frame, outside the render above.
  it("has a Talk line for every switch beneath its card", () => {
    const declared = Object.keys(entry.meta.lines);
    const switchKeys = new Set<string>();
    const sidekickKeys = new Set<string>();
    for (const option of entry.meta.switches ?? []) {
      expect(option.key.trim()).not.toBe("");
      expect(option.sidekick.trim()).not.toBe("");
      expect(switchKeys.has(option.key), `switch "${option.key}" in ${entry.id}`).toBe(false);
      expect(sidekickKeys.has(option.sidekick), `sidekick "${option.sidekick}" in ${entry.id}`).toBe(false);
      expect(declared).toContain(option.sidekick);
      switchKeys.add(option.key);
      sidekickKeys.add(option.sidekick);
    }
  });
});

describe("Talk line keys", () => {
  it("each belong to exactly one entry, and none to the frame", () => {
    const owners = new Map(Object.keys(FRAME_LINES).map((key) => [key, "the frame"]));
    for (const entry of entries) {
      for (const key of Object.keys(entry.meta.lines)) {
        expect(owners.get(key), `"${key}" in ${entry.id}`).toBeUndefined();
        owners.set(key, entry.id);
      }
    }
  });
});
