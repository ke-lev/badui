import { describe, expect, it } from "vitest";
import {
  advance,
  dampingFor,
  gapTo,
  herd,
  pickSpot,
  shrinkFor,
  spring,
  startleFor,
} from "./flee";

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

const SQUARE = { minX: -100, maxX: 100, minY: -100, maxY: 100 };

describe("gapTo", () => {
  const center = { x: 0, y: 0 };
  const half = { x: 40, y: 20 };

  it("is zero inside the box", () => {
    expect(gapTo({ x: 30, y: -10 }, center, half)).toBe(0);
  });

  it("measures straight out from a side", () => {
    expect(gapTo({ x: 70, y: 0 }, center, half)).toBe(30);
  });

  it("measures diagonally from a corner", () => {
    expect(gapTo({ x: 43, y: 24 }, center, half)).toBe(5);
  });
});

describe("pickSpot", () => {
  it("keeps every result inside the bounds", () => {
    for (let i = 0; i < 50; i++) {
      const spot = pickSpot(SQUARE, { x: 0, y: 0 }, { x: 0, y: 0 }, {
        minHop: 40,
        samples: 8,
        random: Math.random,
      });
      expect(spot.x).toBeGreaterThanOrEqual(-100);
      expect(spot.x).toBeLessThanOrEqual(100);
      expect(spot.y).toBeGreaterThanOrEqual(-100);
      expect(spot.y).toBeLessThanOrEqual(100);
    }
  });

  it("takes the sample farthest from the pointer", () => {
    // (0, 0), (-100, -100), (-50, 0)
    const spot = pickSpot(SQUARE, { x: 90, y: 90 }, { x: 60, y: 60 }, {
      minHop: 10,
      samples: 3,
      random: sequence([0.5, 0.5, 0, 0, 0.25, 0.5]),
    });
    expect(spot).toEqual({ x: -100, y: -100 });
  });

  it("passes over a far sample that does not travel the minimum hop", () => {
    // (-100, -100) is where it already is; (0, 0) is a real move.
    const spot = pickSpot(SQUARE, { x: 90, y: 90 }, { x: -100, y: -100 }, {
      minHop: 50,
      samples: 2,
      random: sequence([0, 0, 0.5, 0.5]),
    });
    expect(spot).toEqual({ x: 0, y: 0 });
  });

  it("falls back to the farthest sample when none hop far enough", () => {
    const spot = pickSpot(SQUARE, { x: 90, y: 90 }, { x: 0, y: 0 }, {
      minHop: 1000,
      samples: 2,
      random: sequence([0.5, 0.5, 0, 0]),
    });
    expect(spot).toEqual({ x: -100, y: -100 });
  });

  it("pins an axis to its middle when the range is inverted", () => {
    const spot = pickSpot({ minX: 10, maxX: -10, minY: -5, maxY: 5 }, { x: 0, y: 0 }, { x: 0, y: 0 }, {
      minHop: 0,
      samples: 4,
      random: Math.random,
    });
    expect(spot.x).toBe(0);
  });
});

describe("advance", () => {
  function run(ratio: number) {
    const s = spring(0);
    let peak = 0;
    for (let frame = 0; frame < 60; frame++) {
      advance(s, 100, 1 / 60, 900, dampingFor(900, ratio));
      peak = Math.max(peak, s.value);
    }
    return { s, peak };
  }

  it("overshoots and settles exactly when underdamped", () => {
    const { s, peak } = run(0.55);
    expect(peak).toBeGreaterThan(105);
    expect(peak).toBeLessThan(120);
    expect(s).toEqual({ value: 100, velocity: 0 });
  });

  it("never overshoots when critically damped", () => {
    expect(run(1).peak).toBeLessThanOrEqual(100);
  });

  it("settles to a finer threshold when given one", () => {
    const s = { value: 0.01, velocity: 0 };
    advance(s, 0, 1 / 240, 1600, dampingFor(1600, 0.4), 0.0005);
    expect(s.value).not.toBe(0);
  });
});

describe("herd", () => {
  it("moves straight away from the pointer in open space", () => {
    const next = herd({ x: 0, y: 0 }, { x: -30, y: -40 }, SQUARE, 10);
    expect(next.x).toBeCloseTo(6);
    expect(next.y).toBeCloseTo(8);
  });

  it("turns a push into a wall along the wall, away from the pointer", () => {
    // Away is (0.8, 0.6); the 8 into the right wall joins the 6 going down.
    const next = herd({ x: 100, y: 0 }, { x: 60, y: -30 }, SQUARE, 10);
    expect(next.x).toBe(100);
    expect(next.y).toBeCloseTo(14);
  });

  it("slides toward the roomier side when the pointer is level", () => {
    const next = herd({ x: 100, y: 40 }, { x: 60, y: 40 }, SQUARE, 10);
    expect(next).toEqual({ x: 100, y: 30 });
  });

  it("holds still in a corner with the pointer inward on both axes", () => {
    expect(herd({ x: 100, y: 100 }, { x: 80, y: 70 }, SQUARE, 10)).toEqual({ x: 100, y: 100 });
  });

  it("slides out of a corner when the pointer is outward on one axis", () => {
    const next = herd({ x: 100, y: 100 }, { x: 80, y: 110 }, SQUARE, 10);
    expect(next.x).toBe(100);
    expect(next.y).toBeLessThan(100);
  });

  it("never leaves the bounds", () => {
    const next = herd({ x: 95, y: 0 }, { x: 0, y: 0 }, SQUARE, 500);
    expect(next.x).toBe(100);
  });
});

describe("startleFor", () => {
  it("is 0 at or below calm and 1 at or above startled", () => {
    expect(startleFor(0, 30, 180)).toBe(0);
    expect(startleFor(30, 30, 180)).toBe(0);
    expect(startleFor(180, 30, 180)).toBe(1);
    expect(startleFor(900, 30, 180)).toBe(1);
  });

  it("is halfway at the midpoint", () => {
    expect(startleFor(105, 30, 180)).toBeCloseTo(0.5);
  });
});

describe("shrinkFor", () => {
  it("is 0 at or beyond far", () => {
    expect(shrinkFor(150, 6, 150)).toBe(0);
    expect(shrinkFor(400, 6, 150)).toBe(0);
  });

  it("is 1 at or within near", () => {
    expect(shrinkFor(6, 6, 150)).toBe(1);
    expect(shrinkFor(0, 6, 150)).toBe(1);
  });

  it("is halfway at the midpoint and rises as the gap closes", () => {
    expect(shrinkFor(78, 6, 150)).toBeCloseTo(0.5);
    expect(shrinkFor(40, 6, 150)).toBeGreaterThan(shrinkFor(110, 6, 150));
  });
});
