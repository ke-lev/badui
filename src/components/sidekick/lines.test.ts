import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import CollectionPage from "@/app/collection/page";
import { bespokeLine, line, registerEntryLines, TARGETS } from "./lines";
import { ENTRY_LINES } from "@/components/entry-lines";

// The collection does this as it loads; a static render never gets that far.
registerEntryLines(ENTRY_LINES);

describe.each([
  ["the splash page", Home],
  ["the collection page", CollectionPage],
] as Array<[string, ComponentType]>)("%s", (_, Page) => {
  it("has a bespoke line for every element the cursor envelops", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(createElement(Page));
    const targets = host.querySelectorAll(TARGETS);
    expect(targets.length).toBeGreaterThan(0);
    for (const el of targets) expect(bespokeLine(el), el.outerHTML.slice(0, 80)).toBeDefined();
  });
});

function render(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host.firstElementChild as Element;
}

describe("line", () => {
  it("returns the bespoke line for a keyed element", () => {
    const el = render(`<div data-sidekick="volume-dial" role="slider"></div>`);
    expect(line(el)).toBe("It goes to 100. It does not go to 100 quickly.");
  });

  it("returns the frame line for the prompt copy control", () => {
    const el = render(`<button data-sidekick="copy-prompt">Copy prompt</button>`);
    expect(line(el)).toBe("Everything it needs to happen again.");
  });

  it("returns the frame line for the prompt disclosure", () => {
    const el = render(`<button data-sidekick="prompt-toggle">Agent Prompt</button>`);
    expect(line(el)).toBe("The rest is folded inside.");
  });

  it("inherits the nearest keyed ancestor", () => {
    const el = render(
      `<div data-sidekick="lease-password"><button>Show</button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("Hurry up!");
  });

  it("prefers the closest key over an ancestor's", () => {
    const el = render(
      `<div data-sidekick="lease-password"><button data-sidekick="lease-reveal"></button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("Show");
  });

  it("falls back to the inspector when there is no key", () => {
    expect(line(render(`<a href="/collection">Collection</a>`))).toBe(
      "a → /collection",
    );
  });

  it("falls back to the inspector for an unknown key", () => {
    const el = render(`<button data-sidekick="nope" aria-label="Save"></button>`);
    expect(line(el)).toBe('button "Save"');
  });
});
