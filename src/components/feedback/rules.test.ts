import { describe, expect, it } from "vitest";
import { advanceUpload, displayedPercent, secondsRemaining, UPLOAD_STALL } from "./rules";

describe("advanceUpload", () => {
  it("covers a tenth of the remaining distance", () => {
    expect(advanceUpload(100)).toBeCloseTo(90);
    expect(advanceUpload(90)).toBeCloseTo(81);
  });
});

describe("displayedPercent", () => {
  it("floors to one decimal", () => {
    expect(displayedPercent(100)).toBe(0);
    expect(displayedPercent(90)).toBe(10);
    expect(displayedPercent(81)).toBe(19);
    expect(displayedPercent(0.35)).toBe(99.6);
  });

  it("never shows more than 99.9", () => {
    let remaining = 100;
    for (let tick = 0; tick < 1000; tick++) remaining = advanceUpload(remaining);
    expect(displayedPercent(remaining)).toBe(99.9);
    expect(displayedPercent(0)).toBe(99.9);
  });

  it("reaches 99.9 by the time ticking stops", () => {
    let remaining = 100;
    while (remaining >= UPLOAD_STALL) remaining = advanceUpload(remaining);
    expect(displayedPercent(remaining)).toBe(99.9);
  });
});

describe("secondsRemaining", () => {
  it("estimates three seconds at every point", () => {
    for (const remaining of [100, 42, 0.5, 0.11]) expect(secondsRemaining(remaining)).toBe(3);
  });
});
