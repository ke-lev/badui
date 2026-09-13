import { advance, dampingFor, spring, type Point } from "@/components/buttons/flee";

/** A box in pixels from its area's top-left corner. */
export type Box = { x: number; y: number; w: number; h: number };

/* The envelope: the cursor companion's cuff, reduced to four springs. */

export const IDLE_SIZE = 24;
export const PAD = 6;
/** A 5px control radius plus the pad. */
export const LOCKED_RADIUS = 11;
export const IDLE_STIFFNESS = 190;
export const LOCK_STIFFNESS = 1100;
const IDLE_RATIO = 1;
const LOCK_RATIO = 0.7;

/** The idle envelope: a square of `size` centred on the point. */
export function around(point: Point, size = IDLE_SIZE): Box {
  return { x: point.x - size / 2, y: point.y - size / 2, w: size, h: size };
}

/** A box grown by the pad on every side. */
export function padded(box: Box): Box {
  return { x: box.x - PAD, y: box.y - PAD, w: box.w + PAD * 2, h: box.h + PAD * 2 };
}

export type Envelope = {
  box(): Box;
  /** Jumps to the box with no velocity. */
  place(box: Box): void;
  /** Springs toward the box; returns whether it is still moving. */
  step(target: Box, locked: boolean, dt: number): boolean;
};

/**
 * Soft and critically damped while trailing, stiff and underdamped once
 * locked. Under reduced motion it sits on its target every frame.
 */
export function envelope(reduced: boolean): Envelope {
  const x = spring(0);
  const y = spring(0);
  const w = spring(IDLE_SIZE);
  const h = spring(IDLE_SIZE);
  const all = [x, y, w, h];

  function place(box: Box) {
    [box.x, box.y, box.w, box.h].forEach((value, index) => {
      all[index].value = value;
      all[index].velocity = 0;
    });
  }

  return {
    box: () => ({ x: x.value, y: y.value, w: w.value, h: h.value }),
    place,
    step(target, locked, dt) {
      if (reduced) {
        place(target);
        return false;
      }
      const stiffness = locked ? LOCK_STIFFNESS : IDLE_STIFFNESS;
      const damping = dampingFor(stiffness, locked ? LOCK_RATIO : IDLE_RATIO);
      const goals = [target.x, target.y, target.w, target.h];
      all.forEach((s, index) => advance(s, goals[index], dt, stiffness, damping));
      return all.some((s, index) => s.velocity !== 0 || s.value !== goals[index]);
    },
  };
}

/* Hungry */

export const HUNGRY_STIFFNESS = 9;
export const HUNGRY_START: Point = { x: 28, y: 28 };
export const HUNGRY_SIZE = 24;
export const HUNGRY_GROWTH = 6;
export const HUNGRY_MAX = 72;
export const EAT_MS = 1400;
export const REST_MS = 800;
export const CHEW_AMOUNT = 0.08;
export const CHEW_HZ = 4;

export type HungryPhase = "hunting" | "eating" | "resting";

export type HungryFrame = {
  centre: Point;
  size: number;
  phase: HungryPhase;
  meals: number;
  /** Where to draw the pointer, or null when it is outside or eaten. */
  arrow: Point | null;
  moving: boolean;
};

/**
 * Follows the pointer on a slow critical spring. Within a quarter of its own
 * diameter it swallows the pointer, grows, and holds still through eating and
 * resting before following again. It does not move while the pointer is out.
 */
export function hungryModel() {
  const x = spring(HUNGRY_START.x);
  const y = spring(HUNGRY_START.y);
  const damping = dampingFor(HUNGRY_STIFFNESS, 1);
  let real: Point | null = null;
  let phase: HungryPhase = "hunting";
  let since = 0;
  let size = HUNGRY_SIZE;
  let meals = 0;

  return {
    input(next: Point | null) {
      real = next;
    },
    step(now: number, dt: number): HungryFrame {
      if (phase === "eating" && now - since >= EAT_MS) {
        phase = "resting";
        since = now;
      }
      if (phase === "resting" && now - since >= REST_MS) phase = "hunting";
      if (phase === "hunting" && real) {
        advance(x, real.x, dt, HUNGRY_STIFFNESS, damping);
        advance(y, real.y, dt, HUNGRY_STIFFNESS, damping);
        if (Math.hypot(x.value - real.x, y.value - real.y) <= size / 4) {
          phase = "eating";
          since = now;
          meals += 1;
          size = Math.min(size + HUNGRY_GROWTH, HUNGRY_MAX);
        }
      }
      return {
        centre: { x: x.value, y: y.value },
        size,
        phase,
        meals,
        arrow: phase === "eating" ? null : real,
        moving: phase !== "hunting" || real !== null,
      };
    },
  };
}

/* Opinionated */

export const OPINION_REACH = 40;
export const SHIFT_STIFFNESS = 120;

/** The button after the nearest one, wrapping; -1 when nothing is near. */
export function preferredIndex(nearest: number, count: number): number {
  return nearest < 0 || count < 1 ? -1 : (nearest + 1) % count;
}

/* Screaming */

export const SCREAM_RATE = 70;
export const SCREAM_MAX = 18;

/** How many A's after `ms` of screaming: one at once, one more every 70ms, up to 18. */
export function screamLength(ms: number): number {
  return Math.min(1 + Math.floor(Math.max(ms, 0) / SCREAM_RATE), SCREAM_MAX);
}

export function scream(name: string, ms: number): string {
  const a = "A".repeat(screamLength(ms));
  const loud = name.trim().toUpperCase();
  return loud ? `${loud} ${a}` : a;
}

/** A deterministic jitter whose amplitude grows with the scream. */
export function shake(now: number, ms: number): Point {
  const amplitude = 1.5 + screamLength(ms) * 0.15;
  return { x: amplitude * Math.sin(now * 0.09), y: amplitude * Math.cos(now * 0.13) };
}

/* Clingy */

export const CLING_PULL = 0.85;
export const CLING_BREAK = 200;
export const HOLD_STIFFNESS = 600;
export const SNAP_STIFFNESS = 170;
export const SNAP_RATIO = 0.35;

/** How far a held button is pulled from home toward the pointer, or null once the hold breaks. */
export function clingOffset(home: Point, pointer: Point): Point | null {
  const dx = pointer.x - home.x;
  const dy = pointer.y - home.y;
  if (Math.hypot(dx, dy) > CLING_BREAK) return null;
  return { x: dx * CLING_PULL, y: dy * CLING_PULL };
}
