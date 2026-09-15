import { describe, expect, it } from "vitest";
import {
  CLEAR_CORE,
  COVER_RADIUS,
  DOT_PITCH,
  FAR_HALF_LIFE,
  FAR_REACH,
  MEMORY_SPREAD,
  MIN_RADIUS,
  NEAR_HALF_LIFE,
  PIP_FADE,
  PIP_RADIUS,
  PUSH_DISTANCE,
  BRUSH_RATIO,
  FORGET_REACH,
  FORGET_SPREAD,
  SPRAY_RATE,
  brushRadius,
  coverRadius,
  dotClarity,
  easeMix,
  forgetDistance,
  mapDotRadius,
  sprayCount,
  sprayOffset,
  stepMix,
  halfLifeScale,
  lightRadius,
  memoryDecay,
  memoryHalfLife,
  pipRadius,
  pushAt,
  visibilityAt,
} from "./rules";

describe("fog light", () => {
  it("scales with the shorter side and never shrinks below the minimum", () => {
    expect(lightRadius(400, 300)).toBe(90);
    expect(lightRadius(300, 800)).toBe(90);
    expect(lightRadius(120, 120)).toBe(MIN_RADIUS);
  });

  it("is fully clear across its core and gone at the radius", () => {
    expect(visibilityAt(0, 90)).toBe(1);
    expect(visibilityAt(90 * CLEAR_CORE, 90)).toBe(1);
    expect(visibilityAt(90, 90)).toBe(0);
    expect(visibilityAt(200, 90)).toBe(0);
    expect(visibilityAt(10, 0)).toBe(0);
  });

  it("falls away monotonically across the edge", () => {
    const samples = [0.6, 0.7, 0.8, 0.9, 0.99].map((ratio) => visibilityAt(90 * ratio, 90));
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeLessThan(samples[index - 1]);
    }
  });
});

describe("fog memory", () => {
  it("halves every half-life and holds still over no time", () => {
    expect(memoryDecay(0, 5)).toBe(1);
    expect(memoryDecay(5, 5)).toBeCloseTo(0.5);
    expect(memoryDecay(10, 5)).toBeCloseTo(0.25);
  });

  it("lingers near the light and fogs over fastest far from it", () => {
    expect(memoryHalfLife(0, 90)).toBe(NEAR_HALF_LIFE);
    expect(memoryHalfLife(90, 90)).toBe(NEAR_HALF_LIFE);
    expect(memoryHalfLife(90 * FAR_REACH, 90)).toBeCloseTo(FAR_HALF_LIFE);
    expect(memoryHalfLife(90 * 10, 90)).toBeCloseTo(FAR_HALF_LIFE);
    const samples = [1.5, 2, 2.5, 3].map((radii) => memoryHalfLife(90 * radii, 90));
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeLessThan(samples[index - 1]);
    }
  });

  it("scales each dot's half-life by a fixed factor within the spread", () => {
    const scales = Array.from({ length: 400 }, (_, index) => halfLifeScale(index % 20, Math.floor(index / 20)));
    for (const scale of scales) {
      expect(scale).toBeGreaterThanOrEqual(1 - MEMORY_SPREAD / 2);
      expect(scale).toBeLessThanOrEqual(1 + MEMORY_SPREAD / 2);
    }
    expect(halfLifeScale(7, 3)).toBe(halfLifeScale(7, 3));
    expect(new Set(scales.map((scale) => scale.toFixed(3))).size).toBeGreaterThan(200);
  });
});

describe("blur mix", () => {
  it("crosses end to end in the blur duration and stops at its target", () => {
    expect(stepMix(0, 1, 0.15)).toBeCloseTo(0.5);
    expect(stepMix(0.5, 1, 0.15)).toBe(1);
    expect(stepMix(1, 1, 0.15)).toBe(1);
    expect(stepMix(1, 0, 0.15)).toBeCloseTo(0.5);
    expect(stepMix(0.2, 0, 1)).toBe(0);
    expect(stepMix(0.4, 1, 0)).toBe(0.4);
  });

  it("eases in and out", () => {
    expect(easeMix(0)).toBe(0);
    expect(easeMix(0.5)).toBe(0.5);
    expect(easeMix(1)).toBe(1);
    expect(easeMix(0.1)).toBeLessThan(0.1);
    expect(easeMix(0.9)).toBeGreaterThan(0.9);
  });
});

describe("spray", () => {
  it("sizes the brush from the light", () => {
    expect(brushRadius(100)).toBeCloseTo(100 * BRUSH_RATIO);
  });

  it("lays dots in proportion to distance moved, carrying the remainder", () => {
    expect(sprayCount(10, 0)).toEqual({ count: Math.floor(10 * SPRAY_RATE), carry: expect.any(Number) });
    const first = sprayCount(0.5, 0);
    expect(first.count).toBe(0);
    const second = sprayCount(0.5, first.carry);
    expect(second.count).toBe(1);
    expect(second.carry).toBeCloseTo(SPRAY_RATE - 1);
    expect(sprayCount(-5, 0.3)).toEqual({ count: 0, carry: 0.3 });
  });

  it("lands within the brush, at the pointer when u is 0", () => {
    const centre = sprayOffset(0, 0.3, 80);
    expect(Math.hypot(centre.x, centre.y)).toBe(0);
    for (let index = 0; index < 50; index += 1) {
      const point = sprayOffset(index / 50, (index * 7) / 50, 80);
      expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(80 + 1e-9);
    }
    const edge = sprayOffset(1, 0.25, 80);
    expect(edge.x).toBeCloseTo(0);
    expect(edge.y).toBeCloseTo(80);
  });

  it("forgets each dot at a fixed distance within the spread", () => {
    for (let index = 0; index < 200; index += 1) {
      const distance = forgetDistance(80, index % 17, Math.floor(index / 17));
      expect(distance).toBeGreaterThanOrEqual(80 * FORGET_REACH * (1 - FORGET_SPREAD / 2));
      expect(distance).toBeLessThanOrEqual(80 * FORGET_REACH * (1 + FORGET_SPREAD / 2));
    }
    expect(forgetDistance(80, 4, 9)).toBe(forgetDistance(80, 4, 9));
  });

  it("sizes a laid dot by its scale, overshoot included", () => {
    expect(mapDotRadius(0)).toBe(0);
    expect(mapDotRadius(1)).toBe(COVER_RADIUS);
    expect(mapDotRadius(1.2)).toBeCloseTo(COVER_RADIUS * 1.2);
    expect(mapDotRadius(-0.1)).toBe(0);
  });
});

describe("dots", () => {
  it("overlap their neighbours when fully fogged", () => {
    expect(COVER_RADIUS).toBeGreaterThan((DOT_PITCH * Math.SQRT2) / 2);
  });

  it("let the light win outright and keep part of what they remember", () => {
    expect(dotClarity(1, 0)).toBe(1);
    expect(dotClarity(0, 1)).toBeCloseTo(0.6);
    expect(dotClarity(0.2, 1)).toBeCloseTo(0.6);
    expect(dotClarity(0, 0)).toBe(0);
  });

  it("shrink with clarity", () => {
    expect(coverRadius(0)).toBe(COVER_RADIUS);
    expect(coverRadius(1)).toBe(0);
    expect(coverRadius(0.5)).toBeCloseTo(COVER_RADIUS / 2);
  });

  it("lose their pip before their cover", () => {
    expect(pipRadius(0)).toBe(PIP_RADIUS);
    expect(pipRadius(1 - PIP_FADE)).toBe(0);
    expect(pipRadius(0.9)).toBe(0);
    expect(pipRadius(0.3)).toBeGreaterThan(0);
    expect(pipRadius(0.3)).toBeLessThan(PIP_RADIUS);
  });

  it("are pushed hardest at the light's edge", () => {
    expect(pushAt(90, 90)).toBe(PUSH_DISTANCE);
    expect(pushAt(45, 90)).toBeLessThan(PUSH_DISTANCE / 2);
    expect(pushAt(180, 90)).toBeLessThan(0.2);
    expect(pushAt(10, 0)).toBe(0);
  });
});
