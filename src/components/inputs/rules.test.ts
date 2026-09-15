import { describe, expect, it } from "vitest";
import { LETTERS_BY_FREQUENCY, nameFrom, sortCharacters } from "./rules";

describe("letters", () => {
  it("lists all twenty-six, once each", () => {
    expect(new Set(LETTERS_BY_FREQUENCY).size).toBe(26);
    expect(LETTERS_BY_FREQUENCY[0]).toBe("E");
  });

  it("capitalises only the first", () => {
    expect(nameFrom(["A", "D", "A"])).toBe("Ada");
    expect(nameFrom([])).toBe("");
  });
});

describe("sortCharacters", () => {
  it("sorts by code unit", () => {
    expect(sortCharacters("ada@example.com")).toBe(".@aaacdeelmmopx");
    expect(sortCharacters("Ba1")).toBe("1Ba");
  });
});
