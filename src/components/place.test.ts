import { describe, expect, it } from "vitest";
import { buildLibrary, type LibraryEntry } from "./library";
import { opensElsewhere, parsePlace, placeHref, placeSearch, samePlace } from "./place";

function entry(id: string, category: LibraryEntry["meta"]["category"]): LibraryEntry {
  return {
    id,
    component: () => null,
    meta: { name: id, kind: "benign", category, summary: "", usage: "", prompt: "", lines: {} },
  };
}

const sections = buildLibrary([
  entry("cornered", "buttons"),
  entry("rebound", "sliders"),
  entry("momentum", "sliders"),
]);

describe("parsePlace", () => {
  it("opens the opening shelf when nothing is addressed", () => {
    expect(parsePlace("", sections, "buttons")).toEqual({ category: "buttons", entryId: null });
  });

  it("reads a named category", () => {
    expect(parsePlace("?category=sliders", sections, "buttons")).toEqual({
      category: "sliders",
      entryId: null,
    });
  });

  it("reads an entry and the shelf it is filed under", () => {
    expect(parsePlace("?entry=rebound", sections, "buttons")).toEqual({
      category: "sliders",
      entryId: "rebound",
    });
  });

  it("prefers the entry over a category that disagrees with it", () => {
    expect(parsePlace("?category=buttons&entry=rebound", sections, "buttons")).toEqual({
      category: "sliders",
      entryId: "rebound",
    });
  });

  it("drops an entry it does not know and keeps the named category", () => {
    expect(parsePlace("?category=sliders&entry=nowhere", sections, "buttons")).toEqual({
      category: "sliders",
      entryId: null,
    });
  });

  it("falls back to the opening shelf for a category it does not know", () => {
    expect(parsePlace("?category=nowhere", sections, "buttons")).toEqual({
      category: "buttons",
      entryId: null,
    });
  });

  it("ignores an empty shelf named by an entry that is not filed anywhere", () => {
    expect(parsePlace("?entry=", sections, "buttons")).toEqual({ category: "buttons", entryId: null });
  });

  it("leaves unrelated parameters alone", () => {
    expect(parsePlace("?ref=elsewhere&entry=cornered", sections, "buttons")).toEqual({
      category: "buttons",
      entryId: "cornered",
    });
  });
});

describe("placeSearch", () => {
  it("addresses the opening shelf with nothing at all", () => {
    expect(placeSearch({ category: "buttons", entryId: null }, "buttons")).toBe("");
  });

  it("addresses another shelf by its category", () => {
    expect(placeSearch({ category: "sliders", entryId: null }, "buttons")).toBe("?category=sliders");
  });

  it("addresses an entry by its id alone", () => {
    expect(placeSearch({ category: "sliders", entryId: "rebound" }, "buttons")).toBe("?entry=rebound");
  });
});

describe("placeHref", () => {
  it("is the bare route for the opening shelf", () => {
    expect(placeHref({ category: "buttons", entryId: null }, "buttons")).toBe("/collection");
  });

  it("carries the entry for a detail view", () => {
    expect(placeHref({ category: "sliders", entryId: "rebound" }, "buttons")).toBe(
      "/collection?entry=rebound",
    );
  });
});

describe("round trip", () => {
  it("parses back every place the library can address", () => {
    for (const shelf of sections) {
      const places = [
        { category: shelf.id, entryId: null },
        ...shelf.entries.map((item) => ({ category: shelf.id, entryId: item.id })),
      ];
      for (const place of places) {
        expect(parsePlace(placeSearch(place, "buttons"), sections, "buttons")).toEqual(place);
      }
    }
  });
});

describe("samePlace", () => {
  it("is true only when both the shelf and the entry match", () => {
    expect(samePlace({ category: "sliders", entryId: null }, { category: "sliders", entryId: null })).toBe(true);
    expect(samePlace({ category: "sliders", entryId: "rebound" }, { category: "sliders", entryId: null })).toBe(false);
    expect(samePlace({ category: "buttons", entryId: null }, { category: "sliders", entryId: null })).toBe(false);
  });
});

describe("opensElsewhere", () => {
  const primary = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, button: 0 };

  it("is false for a plain primary click, which the rail handles itself", () => {
    expect(opensElsewhere(primary)).toBe(false);
  });

  it("is true for every modifier that asks for a new tab, window or download", () => {
    for (const held of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(opensElsewhere({ ...primary, [held]: true }), held).toBe(true);
    }
  });

  it("is true for any button but the primary one", () => {
    expect(opensElsewhere({ ...primary, button: 1 })).toBe(true);
    expect(opensElsewhere({ ...primary, button: 2 })).toBe(true);
  });
});
