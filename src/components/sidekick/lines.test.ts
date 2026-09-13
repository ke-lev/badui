import { describe, expect, it } from "vitest";
import { line } from "./lines";

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

  it("inherits the nearest keyed ancestor", () => {
    const el = render(
      `<div data-sidekick="dialog"><button>Cancel</button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("Cancel goes back one. Everything else goes forward.");
  });

  it("prefers the closest key over an ancestor's", () => {
    const el = render(
      `<div data-sidekick="dialog"><button data-sidekick="dialog-close"></button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("This is not an exit.");
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
