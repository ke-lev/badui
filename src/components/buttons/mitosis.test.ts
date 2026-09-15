import { describe, expect, it } from "vitest";
import {
  DIVISION_STEPS,
  extentAlong,
  neckLength,
  divisionTransform,
  lerpPoint,
  splitAt,
  splitAxis,
} from "./mitosis";

const BOUNDS = { minX: -150, maxX: 150, minY: -90, maxY: 90 };

describe("splitAxis", () => {
  it("points from the button centre to the cursor", () => {
    expect(splitAxis({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
  });

  it("uses a vertical split when the cursor is at the centre", () => {
    expect(splitAxis({ x: 8, y: 4 }, { x: 8, y: 4 })).toEqual({ x: 0, y: -1 });
  });
});

describe("splitAt", () => {
  it("places the two children on opposite sides of the cursor", () => {
    const result = splitAt({ x: 0, y: 0 }, { x: 20, y: 0 }, BOUNDS, 42);
    expect(result.origin).toEqual({ x: 20, y: 0 });
    expect(result.first).toEqual({ x: -22, y: 0 });
    expect(result.second).toEqual({ x: 62, y: 0 });
  });

  it("keeps both children within the available bounds", () => {
    const result = splitAt({ x: 0, y: 0 }, { x: 150, y: 90 }, BOUNDS, 42);
    expect(result.first.x).toBeGreaterThanOrEqual(BOUNDS.minX);
    expect(result.first.x).toBeLessThanOrEqual(BOUNDS.maxX);
    expect(result.first.y).toBeGreaterThanOrEqual(BOUNDS.minY);
    expect(result.first.y).toBeLessThanOrEqual(BOUNDS.maxY);
    expect(result.second.x).toBeGreaterThanOrEqual(BOUNDS.minX);
    expect(result.second.x).toBeLessThanOrEqual(BOUNDS.maxX);
    expect(result.second.y).toBeGreaterThanOrEqual(BOUNDS.minY);
    expect(result.second.y).toBeLessThanOrEqual(BOUNDS.maxY);
  });
});

describe("division steps", () => {
  it("start at the parent and rest at the child, unscaled", () => {
    const first = DIVISION_STEPS[0];
    const last = DIVISION_STEPS[DIVISION_STEPS.length - 1];
    expect(first).toMatchObject({ offset: 0, travel: 0, along: 1, across: 1, neck: 0 });
    expect(last).toMatchObject({ offset: 1, travel: 1, along: 1, across: 1, neck: 0 });
  });

  it("run in order", () => {
    for (let i = 1; i < DIVISION_STEPS.length; i++) {
      expect(DIVISION_STEPS[i].offset).toBeGreaterThan(DIVISION_STEPS[i - 1].offset);
    }
  });
});

describe("divisionTransform", () => {
  it("keeps the same function list for any axis", () => {
    expect(divisionTransform({ x: 4, y: -2 }, { x: 1, y: 0 }, 1.16, 0.9)).toBe(
      "translate(-50%, -50%) translate(4px, -2px) rotate(0rad) scale(1.16, 0.9) rotate(0rad)",
    );
  });
});

describe("lerpPoint", () => {
  it("overshoots past the end when t exceeds 1", () => {
    const point = lerpPoint({ x: 0, y: 0 }, { x: 10, y: -20 }, 1.1);
    expect(point.x).toBeCloseTo(11);
    expect(point.y).toBeCloseTo(-22);
  });
});

describe("neckLength", () => {
  it("spans the gap and reaches into both sides", () => {
    expect(neckLength(90, 40, 12, 24)).toBe(74);
  });

  it("never falls below the minimum while the pair overlaps", () => {
    expect(neckLength(0, 60, 12, 24)).toBe(24);
  });
});

describe("extentAlong", () => {
  it("measures width horizontally and height vertically", () => {
    expect(extentAlong({ x: 1, y: 0 }, 60, 39)).toBe(60);
    expect(extentAlong({ x: 0, y: -1 }, 60, 39)).toBe(39);
  });
});
