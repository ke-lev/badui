import { describe, expect, it } from "vitest";
import {
  codeFrom,
  LETTERS_BY_FREQUENCY,
  nameFrom,
  QUANTITY_MAX,
  sortCharacters,
  stepQuantity,
} from "./rules";

describe("stepQuantity", () => {
  it("moves by ten percent, rounded half up", () => {
    expect(stepQuantity(12, 1)).toBe(13);
    expect(stepQuantity(15, 1)).toBe(17);
    expect(stepQuantity(25, 1)).toBe(28);
    expect(stepQuantity(12, -1)).toBe(11);
    expect(stepQuantity(6, -1)).toBe(5);
  });

  it("holds at 5 going down", () => {
    expect(stepQuantity(5, -1)).toBe(5);
  });

  it("holds below 5 going up", () => {
    expect(stepQuantity(4, 1)).toBe(4);
    expect(stepQuantity(1, 1)).toBe(1);
  });

  it("caps at the maximum", () => {
    expect(stepQuantity(990, 1)).toBe(QUANTITY_MAX);
  });
});

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

describe("codeFrom", () => {
  it("keeps up to six digits", () => {
    expect(codeFrom("12 34-56 78")).toBe("123456");
    expect(codeFrom("a1b2")).toBe("12");
  });
});
