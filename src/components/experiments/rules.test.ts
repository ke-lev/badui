import { describe, expect, it } from "vitest";
import { FOG_RADIUS, fogAlphaAt, visibilityAt } from "./rules";

describe("fog field math", () => {
  it("keeps the centre fully visible and the outside fully covered", () => {
    expect(visibilityAt(0)).toBe(1);
    expect(visibilityAt(FOG_RADIUS)).toBe(0);
    expect(fogAlphaAt(0, 0, 0)).toBe(0);
    expect(fogAlphaAt(FOG_RADIUS * 1.2, 0, 0)).toBe(255);
  });

  it("falls away monotonically from the light centre", () => {
    const samples = [0, 0.25, 0.5, 0.75, 0.99].map((ratio) => visibilityAt(FOG_RADIUS * ratio));
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeLessThanOrEqual(samples[index - 1]);
    }
  });

  it("changes the ordered threshold across the dither cells", () => {
    const values = new Set(
      Array.from({ length: 4 }, (_, y) =>
        Array.from({ length: 4 }, (_, x) => fogAlphaAt(FOG_RADIUS * 0.82, x, y)),
      ).flat(),
    );
    expect(values.size).toBeGreaterThan(1);
  });
});
