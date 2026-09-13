import { describe, expect, it } from "vitest";
import { accessibleName, inspect } from "./inspect";

function render(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host.firstElementChild as Element;
}

describe("accessibleName", () => {
  it("prefers aria-label", () => {
    const el = render(`<button aria-label="Close confirmation">x</button>`);
    expect(accessibleName(el)).toBe("Close confirmation");
  });

  it("falls back to aria-labelledby text", () => {
    const el = render(
      `<div><p id="t">Are you sure?</p><div role="dialog" aria-labelledby="t"></div></div>`,
    ).querySelector('[role="dialog"]')!;
    expect(accessibleName(el)).toBe("Are you sure?");
  });

  it("falls back to an associated label element", () => {
    render(`<div><label for="d">Date of birth</label><input id="d" type="range"></div>`);
    expect(accessibleName(document.getElementById("d")!)).toBe("Date of birth");
  });

  it("falls back to a wrapping label", () => {
    const el = render(
      `<label><input type="checkbox"><span>Email updates</span></label>`,
    ).querySelector("input")!;
    expect(accessibleName(el)).toBe("Email updates");
  });

  it("falls back to collapsed text content", () => {
    const el = render(`<button>  Save\n  preferences </button>`);
    expect(accessibleName(el)).toBe("Save preferences");
  });

  it("uses a fieldset's legend as its accessible name", () => {
    const el = render(
      `<fieldset><legend>Select your preferences</legend><label><input type="checkbox"><span>Email updates</span></label></fieldset>`,
    );
    expect(accessibleName(el)).toBe("Select your preferences");
  });

  it("does not concatenate multiple children's text without a space", () => {
    const el = render(`<div><span>Hello</span><span>World</span></div>`);
    expect(accessibleName(el)).toBe("Hello World");
  });

  it("truncates past 40 characters", () => {
    const el = render(`<button aria-label="${"a".repeat(60)}"></button>`);
    expect(accessibleName(el)).toHaveLength(40);
    expect(accessibleName(el).endsWith("…")).toBe(true);
  });

  it("returns an empty string when there is no name", () => {
    expect(accessibleName(render(`<button></button>`))).toBe("");
  });
});

describe("inspect", () => {
  it("reads the volume dial", () => {
    const el = render(
      `<div role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="3"></div>`,
    );
    expect(inspect(el)).toBe('slider "Volume" · 0–100 · now 3');
  });

  it("reads the date slider", () => {
    render(
      `<div><label for="dob">Date of birth</label><input id="dob" type="range" min="0" max="46385" step="1" value="35195"></div>`,
    );
    expect(inspect(document.getElementById("dob")!)).toBe(
      'range "Date of birth" · 0–46385 · step 1',
    );
  });

  it("reads a phone digit button", () => {
    const el = render(`<button aria-label="Increase digit 4, currently 0"></button>`);
    expect(inspect(el)).toBe('button "Increase digit 4, currently 0"');
  });

  it("reads a checked checkbox", () => {
    const el = render(
      `<label><input type="checkbox" checked><span>Email updates</span></label>`,
    ).querySelector("input")!;
    expect(inspect(el)).toBe('checkbox "Email updates" · checked');
  });

  it("reads an unchecked checkbox", () => {
    const el = render(
      `<label><input type="checkbox"><span>Product news</span></label>`,
    ).querySelector("input")!;
    expect(inspect(el)).toBe('checkbox "Product news" · unchecked');
  });

  it("reads an invalid password input", () => {
    render(
      `<div><label for="pw">Create a password</label><input id="pw" type="password" aria-invalid="true"></div>`,
    );
    expect(inspect(document.getElementById("pw")!)).toBe(
      'password "Create a password" · aria-invalid',
    );
  });

  it("reads a non-modal dialog", () => {
    const el = render(
      `<div><p id="dt">Are you sure?</p><div role="dialog" aria-modal="false" aria-labelledby="dt"></div></div>`,
    ).querySelector('[role="dialog"]')!;
    expect(inspect(el)).toBe('dialog "Are you sure?" · aria-modal false');
  });

  it("reports a toggle button's pressed state", () => {
    const el = render(`<button aria-label="Show password" aria-pressed="false"></button>`);
    expect(inspect(el)).toBe('button "Show password" · pressed false');
  });

  it("reads an internal link as its destination", () => {
    const el = render(`<a href="/collection">Collection</a>`);
    expect(inspect(el)).toBe("a → /collection");
  });

  it("reads a fragment link as its fragment", () => {
    expect(inspect(render(`<a href="#top">Back to top</a>`))).toBe("a → #top");
  });

  it("reads an external link as host and path", () => {
    const el = render(`<a href="https://example.com/things?q=1">Out</a>`);
    expect(inspect(el)).toBe("a → example.com/things");
  });

  it("drops the path for an external root link", () => {
    expect(inspect(render(`<a href="https://example.com/">Out</a>`))).toBe(
      "a → example.com",
    );
  });

  it("falls back to role for an unhandled role", () => {
    const el = render(`<div role="status" aria-label="3 selected"></div>`);
    expect(inspect(el)).toBe('status "3 selected"');
  });

  it("falls back to tag name for a bare element", () => {
    expect(inspect(render(`<section></section>`))).toBe("section");
  });

  it("reports a disabled button", () => {
    const el = render(`<button disabled>Save</button>`);
    expect(inspect(el)).toBe('button "Save" · disabled');
  });
});
