// The sidekick's motion model, shared with the frame controls that move the
// same way (the radio dot).
//
// Motion is a velocity-carrying spring rather than exponential decay. Decay can
// only ever approach its target and stop dead; a spring arrives slightly past
// and settles back, which is what reads as mass. Carrying velocity across a
// target change is the other half: moving from one element to the next, the
// cuff flows on its momentum instead of restarting a fresh curve.
// Idle and locked want opposite things. Trailing the cursor must never
// overshoot — the blob would oscillate around the pointer — so idle is
// critically damped and soft. Arrival is where the give belongs, so locked is
// stiffer and underdamped. Both the stiffness and the ratio lerp on `lock`.
export const STIFFNESS_IDLE = 190;
export const STIFFNESS_LOCK = 1100;
export const DAMPING_IDLE = 1.0; // critically damped: smooth trail, no wobble
export const DAMPING_LOCK = 0.7; // ~3.2% past the edge, peak 133ms, settled 266ms
// 1/240 rather than 1/120: at these stiffnesses semi-implicit Euler adds enough
// numerical damping at 1/120 to eat more than half the intended overshoot.
const SUBSTEP = 1 / 240;
const SETTLE = 0.05;
const SETTLE_VELOCITY = 0.5;

export const MAX_STRETCH = 0.26;
export const STRETCH_DIVISOR = 3200;

export type Spring = { value: number; velocity: number };

export function spring(value: number): Spring {
  return { value, velocity: 0 };
}

export function advance(
  s: Spring,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
) {
  let remaining = dt;
  while (remaining > 0) {
    const h = Math.min(SUBSTEP, remaining);
    const accel = stiffness * (target - s.value) - damping * s.velocity;
    s.velocity += accel * h;
    s.value += s.velocity * h;
    remaining -= h;
  }
  if (Math.abs(target - s.value) < SETTLE && Math.abs(s.velocity) < SETTLE_VELOCITY) {
    s.value = target;
    s.velocity = 0;
  }
}

export function settle(s: Spring, target: number) {
  s.value = target;
  s.velocity = 0;
}

export function dampingFor(stiffness: number, ratio: number): number {
  return 2 * ratio * Math.sqrt(stiffness);
}

// A symmetric ellipse is unchanged by a half turn, so the heading only matters
// modulo pi. Folding it into (-pi/2, pi/2] removes the +/-pi wrap where a hair
// of jitter flips the sign by a full turn.
export function foldedHeading(vx: number, vy: number): number {
  let heading = Math.hypot(vx, vy) > 1 ? Math.atan2(vy, vx) : 0;
  if (heading > Math.PI / 2) heading -= Math.PI;
  else if (heading < -Math.PI / 2) heading += Math.PI;
  return heading;
}
