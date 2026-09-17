import { BTC_CLOSES, BTC_FIRST_DAY } from "./btc-closes";
import { PI_DIGITS } from "./pi-digits";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Brightness */

/** The equation `ax + b = cx + d`. */
export type Equation = { a: number; b: number; c: number; d: number };

/**
 * The equation written for `x`. Its coefficients differ by at least one, so
 * `x` is its only solution, and they are derived from `x` alone, so a value
 * always reads the same way.
 */
export function equationFor(x: number): Equation {
  const a = 3 + ((x * 5) % 7);
  const c = a - 1 - ((x * 3) % (a - 1));
  const b = ((x * 11) % 19) - 9;
  return { a, b, c, d: (a - c) * x + b };
}

function side(coefficient: number, constant: number, plus: string, minus: string): string {
  const term = coefficient === 1 ? "x" : `${coefficient}x`;
  if (constant === 0) return term;
  return `${term} ${constant < 0 ? minus : plus} ${Math.abs(constant)}`;
}

export function formatEquation({ a, b, c, d }: Equation): string {
  return `${side(a, b, "+", "−")} = ${side(c, d, "+", "−")}`;
}

/** The same equation with its operators in words, for aria-valuetext. */
export function speakEquation({ a, b, c, d }: Equation): string {
  return `${side(a, b, "plus", "minus")} equals ${side(c, d, "plus", "minus")}`;
}

/** Brightness per percent of daily price change, either side of 50. */
export const BRIGHTNESS_PER_PERCENT = 10;

export const BTC_LAST_DAY = BTC_CLOSES.length - 1;

/** The Catmull-Rom tangent at a whole day, in dollars per day. */
function closeTangent(day: number): number {
  if (day === 0) return BTC_CLOSES[1] - BTC_CLOSES[0];
  if (day === BTC_LAST_DAY) return BTC_CLOSES[day] - BTC_CLOSES[day - 1];
  return (BTC_CLOSES[day + 1] - BTC_CLOSES[day - 1]) / 2;
}

function segment(x: number) {
  const day = Math.min(BTC_LAST_DAY - 1, Math.floor(x));
  return { day, t: x - day };
}

/** The price at x days, on a cubic Hermite curve through the daily closes. */
export function priceAt(x: number): number {
  const { day, t } = segment(x);
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * BTC_CLOSES[day] +
    (t3 - 2 * t2 + t) * closeTangent(day) +
    (-2 * t3 + 3 * t2) * BTC_CLOSES[day + 1] +
    (t3 - t2) * closeTangent(day + 1)
  );
}

/** The slope of that curve at x, in dollars per day. */
export function slopeAt(x: number): number {
  const { day, t } = segment(x);
  const t2 = t * t;
  return (
    (6 * t2 - 6 * t) * BTC_CLOSES[day] +
    (3 * t2 - 4 * t + 1) * closeTangent(day) +
    (-6 * t2 + 6 * t) * BTC_CLOSES[day + 1] +
    (3 * t2 - 2 * t) * closeTangent(day + 1)
  );
}

export function brightnessAt(x: number): number {
  const percentPerDay = (100 * slopeAt(x)) / priceAt(x);
  return Math.round(clamp(50 + BRIGHTNESS_PER_PERCENT * percentPerDay, 0, 100));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The UTC date of the day containing x, as "14 Mar 2026". */
export function formatDay(x: number): string {
  const date = new Date(BTC_FIRST_DAY + Math.floor(x) * 86_400_000);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/* Tip */

/** The last step: every pair from 00 to 99 has appeared by here. */
export const TIP_LAST = PI_DIGITS.length - 2;

/** The percentage at a step: the two decimal digits of π starting there. */
export function tipAt(position: number): number {
  return Number(PI_DIGITS.slice(position, position + 2));
}

/** The digits of π around a step's pair, padded so the pair stays centred. */
export function digitWindow(position: number, reach = 10) {
  const full = `3.${PI_DIGITS}`;
  const at = position + 2;
  return {
    before: full.slice(Math.max(0, at - reach), at).padStart(reach, " "),
    pair: full.slice(at, at + 2),
    after: full.slice(at + 2, at + 2 + reach).padEnd(reach, " "),
  };
}

/* Temperature */

export const TEMPERATURE_MIN = 10;
export const TEMPERATURE_MAX = 30;
/** Half-degree steps across the track. */
export const TEMPERATURE_STEPS = 40;
/** Velocity decays by e^(−friction · seconds). */
export const LOOSE_FRICTION = 1.5;
/** Share of speed kept on rebounding off an end. */
export const LOOSE_RESTITUTION = 0.7;
/** Track widths a second below which the thumb comes to rest. */
export const LOOSE_REST = 0.01;
export const LOOSE_MAX_SPEED = 8;
/** Track widths a second an arrow-key press adds. */
export const LOOSE_KICK = 0.6;
/** Drag samples this recent count toward release speed. */
export const LOOSE_WINDOW_MS = 100;
/** A pointer still for this long before release lets go at rest. */
export const LOOSE_HOLD_MS = 50;

/** A drag position, 0 to 1 across the track, and when it was read. */
export type Sample = { time: number; p: number };

export function temperatureValue(p: number): number {
  return TEMPERATURE_MIN + Math.round(p * TEMPERATURE_STEPS) / 2;
}

/** One frame of free travel, rebounding off either end of the track. */
export function coast(p: number, v: number, dt: number): { p: number; v: number } {
  let next = p + v * dt;
  let speed = v * Math.exp(-LOOSE_FRICTION * dt);
  while (next < 0 || next > 1) {
    next = next < 0 ? -next : 2 - next;
    speed = -speed * LOOSE_RESTITUTION;
  }
  return { p: next, v: Math.abs(speed) < LOOSE_REST ? 0 : speed };
}

/** Track widths a second at the moment of release. */
export function releaseVelocity(samples: Sample[], now: number): number {
  const recent = samples.filter((sample) => now - sample.time <= LOOSE_WINDOW_MS);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (now - last.time > LOOSE_HOLD_MS) return 0;
  const seconds = (last.time - first.time) / 1000;
  if (seconds <= 0) return 0;
  return clamp((last.p - first.p) / seconds, -LOOSE_MAX_SPEED, LOOSE_MAX_SPEED);
}

/* Pointer speed */

export const SPEED_MIN = 0.1;
export const SPEED_MAX = 10;
/** Each pixel of drag scales the value by e^gain. */
export const SPEED_GAIN = 0.02;
/** Each arrow-key press scales the value by this much. */
export const SPEED_KEY_FACTOR = 1.1;

export function scaleSpeed(speed: number, dx: number): number {
  return clamp(speed * Math.exp(SPEED_GAIN * dx), SPEED_MIN, SPEED_MAX);
}

export function nudgeSpeed(speed: number, direction: 1 | -1): number {
  return clamp(direction > 0 ? speed * SPEED_KEY_FACTOR : speed / SPEED_KEY_FACTOR, SPEED_MIN, SPEED_MAX);
}

export function roundSpeed(speed: number): number {
  return Math.round(speed * 10) / 10;
}
