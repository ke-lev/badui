/** A source of uniform numbers in [0, 1), Math.random in the component. */
export type Rng = () => number;

export const THINK_TICK_MS = 150;
/** Points one working tick moves toward the burst's peak. */
export const THINK_STEP_MIN = 1;
export const THINK_STEP_MAX = 3;
/** Share of the last burst each thinking phase gives back. */
export const THINK_DROP_MIN = 0.25;
export const THINK_DROP_MAX = 0.55;
/** Reaching this shows the credits warning. */
export const THINK_WARN_AT = 85;
/** The final credits check holds the upload here. */
export const THINK_LIMIT_AT = 95;
/** What each thinking phase shows, in order, one pause per entry. */
export const THINK_SCRIPT = [
  ["Thinking..."],
  [
    "Thinking...",
    "Reconsidering upload strategy",
  ],
  [
    "Thinking...",
    "Web search: how to upload files",
    "Reading result 1 of 2,340,000",
    "Reading result 2 of 2,340,000",
    "Reading result 3 of 2,340,000",
  ],
  [
    "Loading /upload skill...",
    "Calling subagents...",
    "Waiting for subagents...",
  ],
  [
    "Thinking...",
    "Compacting conversation...",
    "Re-thinking...",
  ],
  [
    "Estimating remaining work...",
    "Remaining work: 5%",
    "Thinking...",
  ],
] as const;
/** Per-line reading times; waiting and compaction hold longer. */
export const THINK_LINE_DURATIONS = [
  [1600],
  [1200, 1600],
  [1200, 1800, 1200, 1200, 1200],
  [1200, 1200, 2600],
  [1200, 3000, 1800],
  [1400, 1600, 2400],
] as const;
/** Remaining credits once the warning shows, then from halfway up the last burst. */
export const THINK_WARN_CREDITS = 10;
export const THINK_LOW_CREDITS = 5;
/** Remaining credits during each line of the final check. */
export const THINK_FINAL_CREDITS = [5, 3, 1] as const;
/** Where each burst stops, one band per scripted pause. */
export const THINK_PEAKS = [
  [38, 48],
  [55, 63],
  [30, 38],
  [58, 66],
  [86, 90],
  [95, 95],
] as const;
/** Pauses that resume inside a fixed band instead of giving back part of the burst, by pause. */
export const THINK_RESUME_AT: Readonly<Record<number, readonly [number, number]>> = {
  1: [0, 0],
  4: [21, 28],
};
export const THINK_ESTIMATE_START = 3;

function between(min: number, max: number, rng: Rng): number {
  return min + (max - min) * rng();
}

/** A whole number from min to max inclusive. */
function wholeBetween(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function tenths(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Where burst `cycle` (from 0) stops: inside its band, or the limit after the script runs out. */
export function planPeak(cycle: number, rng: Rng): number {
  const band = THINK_PEAKS[cycle];
  return band ? tenths(between(band[0], band[1], rng)) : THINK_LIMIT_AT;
}

/** One working tick, never past the peak or the limit. */
export function stepToward(percent: number, peak: number, rng: Rng): number {
  const next = tenths(percent + between(THINK_STEP_MIN, THINK_STEP_MAX, rng));
  return Math.min(next, peak, THINK_LIMIT_AT);
}

/**
 * Where the upload resumes after pause `cycle`: inside that pause's band in
 * THINK_RESUME_AT if it has one, otherwise with 25–55% of the burst from
 * `from` undone.
 */
export function giveBack(percent: number, from: number, cycle: number, rng: Rng): number {
  const band = THINK_RESUME_AT[cycle];
  if (band) return tenths(between(band[0], band[1], rng));
  return tenths(percent - between(THINK_DROP_MIN, THINK_DROP_MAX, rng) * (percent - from));
}

/**
 * Remaining credits shown while the warning is up: 10, or 5 once burst `cycle`
 * is the last one and has covered half its distance to the limit.
 */
export function warningCredits(cycle: number, percent: number, from: number): number {
  const last = cycle === THINK_PEAKS.length - 1;
  return last && percent >= (from + THINK_LIMIT_AT) / 2 ? THINK_LOW_CREDITS : THINK_WARN_CREDITS;
}

/** The countdown shown while working: the burst's estimate less whole seconds elapsed, never below 1. */
export function remainingSeconds(estimate: number, ticks: number): number {
  return Math.max(1, estimate - Math.floor((ticks * THINK_TICK_MS) / 1000));
}

export function remainingText(seconds: number): string {
  return `About ${seconds} ${seconds === 1 ? "second" : "seconds"} remaining`;
}

/** The estimate after a thinking phase: 2–5 seconds more than before. */
export function nextEstimate(estimate: number, rng: Rng): number {
  return estimate + wholeBetween(2, 5, rng);
}

export const TOAST_MS = 5000;
export const SAVE_MS = 900;
