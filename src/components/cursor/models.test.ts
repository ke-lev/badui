import { describe, expect, it } from "vitest";
import { delayedModel, heavyModel, mirroredModel, nearestIndex } from "./models";

const SIZE = { width: 300, height: 200 };

describe("mirroredModel", () => {
  it("reflects across the vertical centre line", () => {
    const model = mirroredModel();
    model.input({ x: 40, y: 70 }, 0);
    expect(model.step(0, 0, SIZE)).toEqual({ at: { x: 260, y: 70 }, moving: false });
  });

  it("draws nothing once the pointer leaves", () => {
    const model = mirroredModel();
    model.input({ x: 40, y: 70 }, 0);
    model.input(null, 10);
    expect(model.step(10, 0, SIZE).at).toBeNull();
  });
});

describe("delayedModel", () => {
  it("shows nothing until the first position is old enough", () => {
    const model = delayedModel(450);
    model.input({ x: 10, y: 10 }, 1000);
    expect(model.step(1449, 0, SIZE)).toEqual({ at: null, moving: true });
    expect(model.step(1450, 0, SIZE)).toEqual({ at: { x: 10, y: 10 }, moving: false });
  });

  it("replays positions in order, then comes to rest", () => {
    const model = delayedModel(450);
    model.input({ x: 10, y: 10 }, 1000);
    model.input({ x: 20, y: 10 }, 1100);
    expect(model.step(1500, 0, SIZE)).toEqual({ at: { x: 10, y: 10 }, moving: true });
    expect(model.step(1560, 0, SIZE)).toEqual({ at: { x: 20, y: 10 }, moving: false });
  });

  it("leaves late too", () => {
    const model = delayedModel(450);
    model.input({ x: 10, y: 10 }, 1000);
    model.input(null, 1100);
    expect(model.step(1500, 0, SIZE).at).toEqual({ x: 10, y: 10 });
    expect(model.step(1550, 0, SIZE)).toEqual({ at: null, moving: false });
  });
});

describe("heavyModel", () => {
  function run(reduced: boolean) {
    const model = heavyModel(reduced);
    model.input({ x: 0, y: 0 }, 0);
    model.input({ x: 100, y: 0 }, 0);
    let peak = 0;
    let result = model.step(0, 0, SIZE);
    for (let frame = 0; frame < 600 && result.moving; frame++) {
      result = model.step(0, 1 / 60, SIZE);
      peak = Math.max(peak, result.at!.x);
    }
    return { peak, result };
  }

  it("starts where the pointer enters", () => {
    const model = heavyModel(false);
    model.input({ x: 30, y: 40 }, 0);
    expect(model.step(0, 1 / 60, SIZE)).toEqual({ at: { x: 30, y: 40 }, moving: false });
  });

  it("swings well past the pointer before settling on it", () => {
    const { peak, result } = run(false);
    expect(peak).toBeGreaterThan(140);
    expect(result).toEqual({ at: { x: 100, y: 0 }, moving: false });
  });

  it("does not overshoot under reduced motion", () => {
    const { peak, result } = run(true);
    expect(peak).toBeLessThanOrEqual(100);
    expect(result.at).toEqual({ x: 100, y: 0 });
  });
});

describe("nearestIndex", () => {
  const boxes = [
    { left: 0, top: 0, right: 30, bottom: 30 },
    { left: 40, top: 0, right: 70, bottom: 30 },
  ];

  it("picks the box under the point", () => {
    expect(nearestIndex({ x: 50, y: 10 }, boxes, 40)).toBe(1);
  });

  it("picks the nearest box within reach", () => {
    expect(nearestIndex({ x: 33, y: 60 }, boxes, 40)).toBe(0);
    expect(nearestIndex({ x: 37, y: 60 }, boxes, 40)).toBe(1);
  });

  it("gives a tie to the earlier box", () => {
    expect(nearestIndex({ x: 35, y: 10 }, boxes, 40)).toBe(0);
  });

  it("picks nothing beyond reach", () => {
    expect(nearestIndex({ x: 120, y: 10 }, boxes, 40)).toBe(-1);
  });
});
