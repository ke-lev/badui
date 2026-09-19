import { describe, expect, it } from "vitest";
import {
  giveBack,
  nextEstimate,
  planPeak,
  stepToward,
  THINK_LIMIT_AT,
  THINK_LINE_DURATIONS,
  THINK_PEAKS,
  THINK_RESUME_AT,
  THINK_SCRIPT,
  THINK_WARN_AT,
  remainingSeconds,
  remainingText,
  warningCredits,
} from "./rules";

const low = () => 0;
const high = () => 0.999999;
const mid = () => 0.5;

describe("planPeak", () => {
  it("stops each burst inside its band", () => {
    expect(planPeak(0, low)).toBe(38);
    expect(planPeak(0, high)).toBe(48);
    expect(planPeak(5, mid)).toBe(95);
  });

  it("runs the burst after the last pause to the limit", () => {
    expect(planPeak(THINK_PEAKS.length, mid)).toBe(THINK_LIMIT_AT);
  });
});

describe("the script", () => {
  it("has one pause per band", () => {
    expect(THINK_SCRIPT.length).toBe(THINK_PEAKS.length);
    expect(THINK_LINE_DURATIONS.map((lines) => lines.length)).toEqual(THINK_SCRIPT.map((lines) => lines.length));
  });

  it("compacting the conversation resumes in the twenties", () => {
    const pause = THINK_SCRIPT.findIndex((lines) =>
      (lines as readonly string[]).includes("Compacting conversation"),
    );
    expect(THINK_RESUME_AT[pause]).toEqual([21, 28]);
  });

  it("reconsidering the upload strategy resumes at zero", () => {
    const pause = THINK_SCRIPT.findIndex((lines) =>
      (lines as readonly string[]).includes("Reconsidering upload strategy"),
    );
    expect(THINK_RESUME_AT[pause]).toEqual([0, 0]);
  });

  it("bands climb without overlapping, and the warning falls between two of them", () => {
    for (let i = 1; i < THINK_PEAKS.length; i++) {
      const floor = THINK_RESUME_AT[i - 1]?.[1] ?? THINK_PEAKS[i - 1][1];
      expect(THINK_PEAKS[i][0]).toBeGreaterThan(floor);
    }
    expect(THINK_PEAKS.at(-1)).toEqual([THINK_LIMIT_AT, THINK_LIMIT_AT]);
    expect(THINK_PEAKS.some(([min]) => min > THINK_WARN_AT)).toBe(true);
  });
});

describe("stepToward", () => {
  it("moves one to three points and stops at the peak", () => {
    expect(stepToward(10, 50, low)).toBe(11);
    expect(stepToward(10, 50, mid)).toBe(12);
    expect(stepToward(49.5, 50, high)).toBe(50);
  });

  it("stops at the limit", () => {
    expect(stepToward(94, 99, high)).toBe(THINK_LIMIT_AT);
  });
});

describe("giveBack", () => {
  it("undoes 25–55% of the burst", () => {
    expect(giveBack(60, 20, 0, low)).toBe(50);
    expect(giveBack(60, 20, 0, high)).toBe(38);
  });

  it("resumes inside a pause's fixed band where it has one", () => {
    expect(giveBack(88, 70, 4, low)).toBe(21);
    expect(giveBack(88, 70, 4, high)).toBe(28);
  });
});

describe("warningCredits", () => {
  it("shows 10% until the last burst is halfway to the limit, then 5%", () => {
    expect(warningCredits(4, 88, 60)).toBe(10);
    expect(warningCredits(5, 59.9, 25)).toBe(10);
    expect(warningCredits(5, 60, 25)).toBe(5);
    expect(warningCredits(5, 95, 25)).toBe(5);
  });
});

describe("remainingSeconds", () => {
  it("counts down a second per 1000ms of ticks and holds at one", () => {
    expect(remainingSeconds(3, 0)).toBe(3);
    expect(remainingSeconds(3, 6)).toBe(3);
    expect(remainingSeconds(3, 7)).toBe(2);
    expect(remainingSeconds(3, 14)).toBe(1);
    expect(remainingSeconds(3, 100)).toBe(1);
  });

  it("reads in the singular at one", () => {
    expect(remainingText(1)).toBe("About 1 second remaining");
    expect(remainingText(2)).toBe("About 2 seconds remaining");
  });
});

describe("nextEstimate", () => {
  it("adds two to five seconds", () => {
    expect(nextEstimate(3, low)).toBe(5);
    expect(nextEstimate(3, high)).toBe(8);
  });
});

describe("a run", () => {
  it("pauses once per scripted entry, then reaches the limit without passing it", () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let run = 0; run < 200; run++) {
      let percent = 0;
      let pauses = 0;
      for (;;) {
        const from = percent;
        const peak = planPeak(pauses, rng);
        expect(peak).toBeGreaterThan(percent);
        while (percent < peak) percent = stepToward(percent, peak, rng);
        if (percent >= THINK_LIMIT_AT) {
          pauses++;
          break;
        }
        percent = giveBack(percent, from, pauses, rng);
        if (!THINK_RESUME_AT[pauses]) expect(percent).toBeGreaterThanOrEqual(from);
        pauses++;
      }
      expect(percent).toBe(THINK_LIMIT_AT);
      expect(pauses).toBe(THINK_SCRIPT.length);
    }
  });
});
