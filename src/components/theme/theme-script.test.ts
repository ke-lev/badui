import { afterEach, describe, expect, it } from "vitest";
import { isTheme, THEME_SCRIPT, THEME_STORAGE_KEY } from "./theme-script";

function runScript() {
  new Function(THEME_SCRIPT)();
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("THEME_SCRIPT", () => {
  it.each(["light", "dark"])("applies a stored %s theme", (theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    runScript();
    expect(document.documentElement.getAttribute("data-theme")).toBe(theme);
  });

  it("leaves the attribute unset with no stored choice, so the system decides", () => {
    runScript();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("ignores an unrecognised stored value", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    runScript();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("isTheme", () => {
  it("accepts only light and dark", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});
