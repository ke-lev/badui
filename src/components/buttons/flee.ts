export type Point = { x: number; y: number };

export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

export type Spring = { value: number; velocity: number };

export function spring(value: number): Spring {
  return { value, velocity: 0 };
}

// Same integrator as the cursor companion: a velocity-carrying spring stepped
// at 1/240 so semi-implicit Euler does not eat the overshoot. `epsilon` is the
// settle threshold in the spring's own units — pixels for position, a fraction
// for scale — and velocity settles at ten times it.
const SUBSTEP = 1 / 240;

export function advance(
  s: Spring,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
  epsilon = 0.05,
) {
  let remaining = dt;
  while (remaining > 0) {
    const h = Math.min(SUBSTEP, remaining);
    const accel = stiffness * (target - s.value) - damping * s.velocity;
    s.velocity += accel * h;
    s.value += s.velocity * h;
    remaining -= h;
  }
  if (Math.abs(target - s.value) < epsilon && Math.abs(s.velocity) < epsilon * 10) {
    s.value = target;
    s.velocity = 0;
  }
}

export function dampingFor(stiffness: number, ratio: number): number {
  return 2 * ratio * Math.sqrt(stiffness);
}

/** Distance from a point to the nearest edge of a box; zero when inside it. */
export function gapTo(point: Point, center: Point, half: Point): number {
  const dx = Math.max(Math.abs(point.x - center.x) - half.x, 0);
  const dy = Math.max(Math.abs(point.y - center.y) - half.y, 0);
  return Math.hypot(dx, dy);
}

/**
 * Samples candidate centres inside `bounds` and returns the one farthest from
 * the pointer among those at least `minHop` from `from`, so every move is a
 * visible one. When no sample travels far enough — a cramped area — the
 * farthest from the pointer wins regardless.
 */
export function pickSpot(
  bounds: Bounds,
  pointer: Point,
  from: Point,
  options: { minHop: number; samples: number; random: () => number },
): Point {
  const [minX, maxX] = span(bounds.minX, bounds.maxX);
  const [minY, maxY] = span(bounds.minY, bounds.maxY);

  let best: Point | null = null;
  let bestScore = -Infinity;
  let fallback: Point = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  let fallbackScore = -Infinity;

  for (let i = 0; i < options.samples; i++) {
    const candidate = {
      x: minX + (maxX - minX) * options.random(),
      y: minY + (maxY - minY) * options.random(),
    };
    const score = Math.hypot(candidate.x - pointer.x, candidate.y - pointer.y);
    if (score > fallbackScore) {
      fallback = candidate;
      fallbackScore = score;
    }
    const hop = Math.hypot(candidate.x - from.x, candidate.y - from.y);
    if (hop >= options.minHop && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best ?? fallback;
}

// An inverted range means the box is wider than its area; pin it to the middle.
function span(min: number, max: number): [number, number] {
  if (min <= max) return [min, max];
  const mid = (min + max) / 2;
  return [mid, mid];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * One step of being pushed `distance` directly away from the pointer, inside
 * `bounds`. Where the push drives into a wall already reached, that part of it
 * goes nowhere: `blocked` is the share of the unit push pressing into walls,
 * per axis, and only the rest moves the position.
 */
export function herd(
  position: Point,
  pointer: Point,
  bounds: Bounds,
  distance: number,
): { position: Point; blocked: Point } {
  const [minX, maxX] = span(bounds.minX, bounds.maxX);
  const [minY, maxY] = span(bounds.minY, bounds.maxY);
  const dx = position.x - pointer.x;
  const dy = position.y - pointer.y;
  const length = Math.hypot(dx, dy);

  const ux = length > 0 ? dx / length : roomier(position.x, minX, maxX);
  const uy = length > 0 ? dy / length : 0;

  const blockedX = (ux > 0 && position.x >= maxX) || (ux < 0 && position.x <= minX);
  const blockedY = (uy > 0 && position.y >= maxY) || (uy < 0 && position.y <= minY);

  return {
    position: {
      x: blockedX ? position.x : clamp(position.x + ux * distance, minX, maxX),
      y: blockedY ? position.y : clamp(position.y + uy * distance, minY, maxY),
    },
    blocked: { x: blockedX ? ux : 0, y: blockedY ? uy : 0 },
  };
}

function roomier(value: number, min: number, max: number): number {
  return max - value >= value - min ? 1 : -1;
}

/** How alarmed a pointer speed is: 0 at `calm` or slower, 1 at `startled` or faster, eased at both ends. */
export function startleFor(speed: number, calm: number, startled: number): number {
  return 1 - shrinkFor(speed, calm, startled);
}

/** How far to shrink: 0 at `far` or beyond, 1 at `near` or closer, eased at both ends. */
export function shrinkFor(gap: number, near: number, far: number): number {
  if (gap <= near) return 1;
  if (gap >= far) return 0;
  const t = (far - gap) / (far - near);
  return t * t * (3 - 2 * t);
}
