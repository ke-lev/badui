import { describe, expect, it } from "vitest";
import {
  clingOffset,
  EAT_MS,
  envelope,
  HUNGRY_GROWTH,
  HUNGRY_MAX,
  HUNGRY_SIZE,
  HUNGRY_START,
  hungryModel,
  preferredIndex,
  REST_MS,
  scream,
  SCREAM_MAX,
  shake,
} from "./models";

const FRAME = 16;

function untilEating(model: ReturnType<typeof hungryModel>, from: number) {
  let now = from;
  let frame = model.step(now, 0);
  while (frame.phase !== "eating" && now < from + 10_000) {
    now += FRAME;
    frame = model.step(now, FRAME / 1000);
  }
  return { now, frame };
}

describe("hungryModel", () => {
  it("stays where it started while the pointer is outside", () => {
    const model = hungryModel();
    const frame = model.step(1000, FRAME / 1000);
    expect(frame.centre).toEqual(HUNGRY_START);
    expect(frame.arrow).toBeNull();
    expect(frame.moving).toBe(false);
  });

  it("swallows a pointer that holds still, and grows", () => {
    const model = hungryModel();
    model.input({ x: 200, y: 100 });
    const { now, frame } = untilEating(model, 0);
    expect(frame.phase).toBe("eating");
    expect(frame.arrow).toBeNull();
    expect(frame.meals).toBe(1);
    expect(frame.size).toBe(HUNGRY_SIZE + HUNGRY_GROWTH);

    const resting = model.step(now + EAT_MS, FRAME / 1000);
    expect(resting.phase).toBe("resting");
    expect(resting.arrow).toEqual({ x: 200, y: 100 });
  });

  it("eats a still pointer again as soon as it has rested", () => {
    const model = hungryModel();
    model.input({ x: 200, y: 100 });
    const { now } = untilEating(model, 0);
    model.step(now + EAT_MS, FRAME / 1000);
    const again = model.step(now + EAT_MS + REST_MS, FRAME / 1000);
    expect(again.phase).toBe("eating");
    expect(again.meals).toBe(2);
  });

  it("stops growing at its maximum size", () => {
    const model = hungryModel();
    model.input({ x: 200, y: 100 });
    let now = 0;
    let frame = model.step(now, 0);
    while (frame.meals < 12 && now < 120_000) {
      now += FRAME;
      frame = model.step(now, FRAME / 1000);
    }
    expect(frame.size).toBe(HUNGRY_MAX);
  });
});

describe("envelope", () => {
  it("sits on its target under reduced motion", () => {
    const cuff = envelope(true);
    const target = { x: 10, y: 20, w: 30, h: 40 };
    expect(cuff.step(target, true, FRAME / 1000)).toBe(false);
    expect(cuff.box()).toEqual(target);
  });

  it("passes a locked target before settling on it", () => {
    const cuff = envelope(false);
    cuff.place({ x: 0, y: 0, w: 24, h: 24 });
    const target = { x: 100, y: 0, w: 24, h: 24 };
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      cuff.step(target, true, FRAME / 1000);
      peak = Math.max(peak, cuff.box().x);
    }
    expect(peak).toBeGreaterThan(100);
    expect(cuff.box().x).toBe(100);
  });
});

describe("preferredIndex", () => {
  it("prefers the next button along, wrapping", () => {
    expect(preferredIndex(0, 3)).toBe(1);
    expect(preferredIndex(1, 3)).toBe(2);
    expect(preferredIndex(2, 3)).toBe(0);
  });

  it("has no preference when nothing is near", () => {
    expect(preferredIndex(-1, 3)).toBe(-1);
  });
});

describe("scream", () => {
  it("starts with one A and the name in capitals", () => {
    expect(scream("Submit", 0)).toBe("SUBMIT A");
  });

  it("adds an A every 70ms", () => {
    expect(scream("", 140)).toBe("AAA");
  });

  it("stops at eighteen", () => {
    expect(scream("Name", 1_000_000)).toBe(`NAME ${"A".repeat(SCREAM_MAX)}`);
  });

  it("shakes within an amplitude that grows with the scream", () => {
    for (let now = 0; now < 1000; now += 7) {
      const jolt = shake(now, 1_000_000);
      expect(Math.abs(jolt.x)).toBeLessThanOrEqual(1.5 + SCREAM_MAX * 0.15);
      expect(Math.abs(jolt.y)).toBeLessThanOrEqual(1.5 + SCREAM_MAX * 0.15);
    }
  });
});

describe("clingOffset", () => {
  it("pulls 85% of the way toward the pointer", () => {
    expect(clingOffset({ x: 0, y: 0 }, { x: 100, y: 0 })).toEqual({ x: 85, y: 0 });
  });

  it("holds at exactly 200px", () => {
    expect(clingOffset({ x: 0, y: 0 }, { x: 0, y: 200 })).toEqual({ x: 0, y: 170 });
  });

  it("lets go beyond 200px", () => {
    expect(clingOffset({ x: 0, y: 0 }, { x: 0, y: 201 })).toBeNull();
  });
});
