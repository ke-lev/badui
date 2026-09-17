import { describe, expect, it } from "vitest";
import {
  angleDifference,
  CARD_RADIUS,
  angleOf,
  formatNumber,
  holeAt,
  HOLE_DIGITS,
  HOLE_RING,
  PLATE_RADIUS,
  pointAt,
  pull,
  reachedStop,
  restAngle,
  returning,
  travelFor,
} from "./rules";

describe("rotary geometry", () => {
  it("sends 1 the shortest way and 0 the longest", () => {
    expect(travelFor(1)).toBe(60);
    expect(travelFor(9)).toBe(300);
    expect(travelFor(0)).toBe(330);
  });

  it("centres the hole ring between the card and the plate edge", () => {
    expect(HOLE_RING - CARD_RADIUS).toBe(PLATE_RADIUS - HOLE_RING);
  });

  it("rests each hole its travel short of the stop", () => {
    expect(HOLE_DIGITS.map(restAngle)).toEqual([60, 30, 0, 330, 300, 270, 240, 210, 180, 150]);
  });

  it("measures angles clockwise from twelve o'clock", () => {
    expect(angleOf(0, -1)).toBeCloseTo(0);
    expect(angleOf(1, 0)).toBeCloseTo(90);
    expect(angleOf(0, 1)).toBeCloseTo(180);
    expect(angleOf(-1, 0)).toBeCloseTo(270);
  });

  it("stays continuous across the seam", () => {
    expect(angleDifference(350, 10)).toBe(20);
    expect(angleDifference(10, 350)).toBe(-20);
  });

  it("finds the hole under a point and nothing between holes", () => {
    for (const digit of HOLE_DIGITS) {
      const { x, y } = pointAt(restAngle(digit), HOLE_RING);
      expect(holeAt(x, y)).toBe(digit);
    }
    expect(holeAt(112, 112)).toBeNull();
    const between = pointAt(120, HOLE_RING);
    expect(holeAt(between.x, between.y)).toBeNull();
  });

  it("pulls clockwise no further than the stop", () => {
    expect(pull(0, -15, 60)).toBe(0);
    expect(pull(50, 30, 60)).toBe(60);
    expect(pull(20, 10, 60)).toBe(30);
  });

  it("counts a release only at the stop", () => {
    expect(reachedStop(54, 60)).toBe(false);
    expect(reachedStop(55, 60)).toBe(true);
  });

  it("returns at a constant speed", () => {
    expect(returning(330, 0)).toBe(330);
    expect(returning(330, 500)).toBe(180);
    expect(returning(330, 1100)).toBe(0);
    expect(returning(330, 5000)).toBe(0);
  });

  it("groups the number 3–3–4", () => {
    expect(formatNumber([])).toBe("");
    expect(formatNumber([5, 5, 5, 1])).toBe("555 1");
    expect(formatNumber([5, 5, 5, 1, 2, 3, 4, 5, 6, 7])).toBe("555 123 4567");
  });
});
