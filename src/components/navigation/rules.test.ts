import { describe, expect, it } from "vitest";
import { moveToEnd, nextPage, PAGE_COUNT, previousPage, visibleCrumbs } from "./rules";

describe("nextPage", () => {
  it("doubles the page up to the last", () => {
    expect([1, 2, 3, 12, 13, 24].map(nextPage)).toEqual([2, 4, 6, 24, 24, 24]);
  });
});

describe("previousPage", () => {
  it("halves the page, rounding down, to no lower than the first", () => {
    expect([24, 13, 3, 2, 1].map(previousPage)).toEqual([12, 6, 1, 1, 1]);
  });

  it("never reaches page 5 from page 1", () => {
    const seen = new Set([1]);
    const queue = [1];
    while (queue.length) {
      const page = queue.shift()!;
      for (const next of [nextPage(page), previousPage(page)]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6, 8, 12, 16, PAGE_COUNT]);
  });
});

describe("moveToEnd", () => {
  it("puts the item last and keeps the rest in order", () => {
    expect(moveToEnd(["a", "b", "c", "d"], "b")).toEqual(["a", "c", "d", "b"]);
    expect(moveToEnd(["a", "b"], "b")).toEqual(["a", "b"]);
  });
});

describe("visibleCrumbs", () => {
  it("shows every crumb up to four", () => {
    expect(visibleCrumbs(4, false)).toEqual([0, 1, 2, 3]);
  });

  it("folds the middle of a longer trail", () => {
    expect(visibleCrumbs(6, false)).toEqual([0, null, 4, 5]);
    expect(visibleCrumbs(6, true)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
