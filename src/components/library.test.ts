import { describe, expect, it } from "vitest";
import { buildLibrary, CATEGORIES, formatRange, type LibraryEntry } from "./library";

function entry(id: string, category: LibraryEntry["meta"]["category"]): LibraryEntry {
  return {
    id,
    component: () => null,
    meta: { name: id, kind: "benign", category, summary: "", usage: "", prompt: "", lines: {} },
  };
}

describe("buildLibrary", () => {
  it("returns one section per category, in the declared order", () => {
    const sections = buildLibrary([]);
    expect(sections.map((section) => section.id)).toEqual(CATEGORIES.map((category) => category.id));
  });

  it("files an entry under its own category", () => {
    const sections = buildLibrary([entry("password-field", "inputs")]);
    const inputs = sections.find((section) => section.id === "inputs")!;
    expect(inputs.entries.map((item) => item.id)).toEqual(["password-field"]);
  });

  it("keeps entries of one category in the order they were declared", () => {
    const sections = buildLibrary([
      entry("volume-control", "specimens"),
      entry("date-picker", "specimens"),
      entry("phone-number", "specimens"),
    ]);
    const specimens = sections.find((section) => section.id === "specimens")!;
    expect(specimens.entries.map((item) => item.id)).toEqual([
      "volume-control",
      "date-picker",
      "phone-number",
    ]);
  });

  it("leaves a category with no entries empty rather than dropping it", () => {
    const sections = buildLibrary([entry("password-field", "inputs")]);
    const cursor = sections.find((section) => section.id === "cursor")!;
    expect(cursor.entries).toEqual([]);
  });

  it("carries the display label for each section", () => {
    const sections = buildLibrary([]);
    expect(sections.find((section) => section.id === "specimens")!.label).toBe("Specimens");
  });
});

describe("formatRange", () => {
  it("spans the count as a padded range", () => {
    expect(formatRange(6)).toBe("01 — 06");
  });

  it("shows a single entry as one number", () => {
    expect(formatRange(1)).toBe("01");
  });

  it("shows nothing for an empty category", () => {
    expect(formatRange(0)).toBe("");
  });
});
