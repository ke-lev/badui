import { describe, expect, it } from "vitest";
import {
  chew,
  CHEW_COUNT,
  CHEW_OPEN_SHARE,
  clingOffset,
  contains,
  EAT_MS,
  envelope,
  HUNGRY_START,
  hungryModel,
  OPINION_REACH,
  REST_MS,
  scream,
  SCREAM_MAX,
  shake,
  steer,
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

  it("swallows a pointer that holds still", () => {
    const model = hungryModel();
    model.input({ x: 200, y: 100 });
    const { now, frame } = untilEating(model, 0);
    expect(frame.phase).toBe("eating");
    expect(frame.arrow).toBeNull();
    expect(frame.meals).toBe(1);

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
});

describe("chew", () => {
  const cycle = EAT_MS / CHEW_COUNT;

  it("starts shut and still", () => {
    expect(chew(0).open).toBe(0);
    expect(chew(0).side).toBeCloseTo(0);
  });

  it("is wide open at the end of the opening share", () => {
    expect(chew(cycle * CHEW_OPEN_SHARE).open).toBeCloseTo(1);
  });

  it("opens gradually and bites shut faster", () => {
    const opening = chew(cycle * 0.1).open;
    const closing = 1 - chew(cycle * (1 - 0.1)).open;
    expect(opening).toBeLessThan(0.1);
    expect(closing).toBeGreaterThan(0.3);
  });

  it("ends the meal shut, after exactly its chews", () => {
    expect(chew(EAT_MS - 0.001).open).toBeLessThan(0.001);
    expect(chew(cycle * 1.3).open).toBeCloseTo(chew(cycle * 0.3).open);
  });

  it("stays within its range", () => {
    for (let ms = 0; ms < EAT_MS; ms += 7) {
      const { open, side } = chew(ms);
      expect(open).toBeGreaterThanOrEqual(0);
      expect(open).toBeLessThanOrEqual(1);
      expect(Math.abs(side)).toBeLessThanOrEqual(1);
    }
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

describe("steer", () => {
  const avoid = { x: 100, y: 100, w: 110, h: 40 };
  const prefer = { x: 218, y: 100, w: 75, h: 40 };

  it("never lands inside the avoided box while it is in reach", () => {
    for (let x = avoid.x - OPINION_REACH; x <= avoid.x + avoid.w + OPINION_REACH; x += 5) {
      for (let y = avoid.y - OPINION_REACH; y <= avoid.y + avoid.h + OPINION_REACH; y += 5) {
        const goal = steer({ x, y }, avoid, prefer);
        expect(goal).not.toBeNull();
        expect(contains(avoid, goal!)).toBe(false);
        expect(contains(prefer, goal!)).toBe(true);
      }
    }
  });

  it("maps the edges of the reach onto the preferred box's inset edges", () => {
    expect(steer({ x: 60, y: 60 }, avoid, prefer)).toEqual({ x: 224, y: 106 });
    expect(steer({ x: 250, y: 180 }, avoid, prefer)).toEqual({ x: 287, y: 134 });
  });

  it("lets go outside the reach", () => {
    expect(steer({ x: 59, y: 120 }, avoid, prefer)).toBeNull();
    expect(steer({ x: 251, y: 120 }, avoid, prefer)).toBeNull();
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
