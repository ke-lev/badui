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
  coverRadius,
  dotClarity,
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
