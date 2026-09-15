import { describe, expect, it } from "vitest";
import { BTC_CLOSES } from "./btc-closes";
import { PI_DIGITS } from "./pi-digits";
import {
  brightnessAt,
  BTC_LAST_DAY,
  coast,
  digitWindow,
  equationFor,
  formatDay,
  formatEquation,
  LOOSE_MAX_SPEED,
  nudgeSpeed,
  priceAt,
  releaseVelocity,
  roundSpeed,
  scaleSpeed,
  slopeAt,
  speakEquation,
  thermostatValue,
  TIP_LAST,
  tipAt,
} from "./rules";

describe("equationFor", () => {
  it("has the value as its only solution, for every value", () => {
    for (let x = 0; x <= 100; x++) {
      const { a, b, c, d } = equationFor(x);
      expect(a - c, `x = ${x}`).toBeGreaterThan(0);
      expect(c, `x = ${x}`).toBeGreaterThanOrEqual(1);
      expect((d - b) / (a - c), `x = ${x}`).toBe(x);
    }
  });

  it("writes the equation with typographic minus signs", () => {
    expect(formatEquation(equationFor(60))).toBe("9x + 5 = 4x + 305");
    expect(formatEquation(equationFor(0))).toBe("3x − 9 = 2x − 9");
  });

  it("drops a coefficient of one and a constant of zero", () => {
    expect(formatEquation({ a: 4, b: 0, c: 1, d: 9 })).toBe("4x = x + 9");
  });

  it("speaks the operators", () => {
    expect(speakEquation(equationFor(0))).toBe("3x minus 9 equals 2x minus 9");
  });
});

describe("brightness curve", () => {
  it("passes through every daily close", () => {
    for (let day = 0; day <= BTC_LAST_DAY; day++) {
      expect(priceAt(day), `day ${day}`).toBeCloseTo(BTC_CLOSES[day], 6);
    }
  });

  it("gives the derivative of the curve as its slope", () => {
    for (let day = 0; day < BTC_LAST_DAY; day++) {
      const x = day + 0.37;
      const numeric = (priceAt(x + 1e-4) - priceAt(x - 1e-4)) / 2e-4;
      expect(slopeAt(x), `x = ${x}`).toBeCloseTo(numeric, 1);
    }
  });

  it("keeps the curve inside the plot", () => {
    for (let i = 0; i <= BTC_LAST_DAY * 100; i++) {
      const price = priceAt(i / 100);
      expect(price).toBeGreaterThan(50_000);
      expect(price).toBeLessThan(130_000);
    }
  });

  it("reaches every brightness at hundredth-of-a-day steps", () => {
    const reached = new Set<number>();
    for (let i = 0; i <= BTC_LAST_DAY * 100; i++) reached.add(brightnessAt(i / 100));
    expect(reached.size).toBe(101);
  });

  it("starts at 63 on 14 March 2026", () => {
    expect(brightnessAt(180)).toBe(63);
    expect(formatDay(180)).toBe("14 Mar 2026");
  });

  it("dates the first and last days", () => {
    expect(formatDay(0)).toBe("15 Sep 2025");
    expect(formatDay(BTC_LAST_DAY)).toBe("14 Sep 2026");
    expect(formatDay(0.99)).toBe("15 Sep 2025");
  });
});

// An independent computation of π by Machin's formula, in fixed point.
function machinDigits(count: number): string {
  let unity = BigInt(1);
  for (let i = 0; i < count + 10; i++) unity *= BigInt(10);
  const arccot = (x: bigint) => {
    let sum = BigInt(0);
    let term = unity / x;
    let n = BigInt(1);
    let sign = BigInt(1);
    while (term !== BigInt(0)) {
      sum += sign * (term / n);
      term /= x * x;
      n += BigInt(2);
      sign = -sign;
    }
    return sum;
  };
  const pi = BigInt(4) * (BigInt(4) * arccot(BigInt(5)) - arccot(BigInt(239)));
  return pi.toString().slice(1, count + 1);
}

describe("tip", () => {
  it("reads the decimal digits of π", () => {
    expect(PI_DIGITS).toBe(machinDigits(PI_DIGITS.length));
  });

  it("starts at 14 and reaches every percentage from 0 to 99 by the last step", () => {
    expect(tipAt(0)).toBe(14);
    const seen = new Set(Array.from({ length: TIP_LAST + 1 }, (_, position) => tipAt(position)));
    expect(seen.size).toBe(100);
    const before = new Set(Array.from({ length: TIP_LAST }, (_, position) => tipAt(position)));
    expect(before.size).toBe(99);
  });

  it("centres the pair in its strip of digits", () => {
    expect(digitWindow(0)).toEqual({ before: " ".repeat(8) + "3.", pair: "14", after: "1592653589" });
    expect(digitWindow(TIP_LAST).after).toBe(" ".repeat(10));
  });
});

describe("thermostat", () => {
  it("reads in half degrees from 10 to 30", () => {
    expect(thermostatValue(0)).toBe(10);
    expect(thermostatValue(1)).toBe(30);
    expect(thermostatValue(0.55)).toBe(21);
    expect(thermostatValue(0.57)).toBe(21.5);
  });

  it("travels and slows between the ends", () => {
    const next = coast(0.5, 1, 0.05);
    expect(next.p).toBeCloseTo(0.55);
    expect(next.v).toBeCloseTo(Math.exp(-0.075));
  });

  it("rebounds off either end with less speed", () => {
    const right = coast(0.98, 1, 0.05);
    expect(right.p).toBeCloseTo(0.97);
    expect(right.v).toBeLessThan(0);
    expect(Math.abs(right.v)).toBeLessThan(0.7);
    const left = coast(0.02, -1, 0.05);
    expect(left.p).toBeCloseTo(0.03);
    expect(left.v).toBeGreaterThan(0);
  });

  it("stays on the track and comes to rest", () => {
    let state = { p: 0.5, v: LOOSE_MAX_SPEED };
    let frames = 0;
    while (state.v !== 0 && frames < 10_000) {
      state = coast(state.p, state.v, 1 / 60);
      expect(state.p).toBeGreaterThanOrEqual(0);
      expect(state.p).toBeLessThanOrEqual(1);
      frames++;
    }
    expect(state.v).toBe(0);
  });

  it("lets go at the speed of the last 100ms of drag", () => {
    const samples = [
      { time: 0, p: 0 },
      { time: 950, p: 0.2 },
      { time: 1000, p: 0.3 },
    ];
    expect(releaseVelocity(samples, 1010)).toBeCloseTo(2);
  });

  it("lets go at rest after a pause, a single sample, or a still pointer", () => {
    expect(releaseVelocity([{ time: 900, p: 0.1 }, { time: 940, p: 0.3 }], 1000)).toBe(0);
    expect(releaseVelocity([{ time: 990, p: 0.3 }], 1000)).toBe(0);
    expect(releaseVelocity([{ time: 990, p: 0.3 }, { time: 990, p: 0.3 }], 1000)).toBe(0);
  });

  it("caps release speed", () => {
    expect(releaseVelocity([{ time: 990, p: 0 }, { time: 1000, p: 1 }], 1000)).toBe(LOOSE_MAX_SPEED);
  });
});

describe("pointer speed", () => {
  it("scales by a share of itself per pixel, reversibly", () => {
    expect(scaleSpeed(1, 0)).toBe(1);
    expect(scaleSpeed(1, 50)).toBeCloseTo(Math.E);
    expect(scaleSpeed(scaleSpeed(2, 30), -30)).toBeCloseTo(2);
  });

  it("stays between 0.1 and 10", () => {
    expect(scaleSpeed(1, -1000)).toBe(0.1);
    expect(scaleSpeed(1, 1000)).toBe(10);
    expect(nudgeSpeed(10, 1)).toBe(10);
    expect(nudgeSpeed(0.1, -1)).toBe(0.1);
  });

  it("moves by ten percent per key press and shows one decimal", () => {
    expect(nudgeSpeed(2, 1)).toBeCloseTo(2.2);
    expect(nudgeSpeed(2.2, -1)).toBeCloseTo(2);
    expect(roundSpeed(1.04)).toBe(1);
    expect(roundSpeed(1.06)).toBe(1.1);
  });
});
