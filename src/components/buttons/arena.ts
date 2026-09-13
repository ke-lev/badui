import { dampingFor, spring, type Bounds, type Point, type Spring } from "./flee";

/** Clearance every button keeps from its area's walls. */
const EDGE = 12;

// The squash is its own spring, kicked on landing or on meeting a wall. Low
// ratio and high stiffness make it one quick wobble.
export const SQUASH_STIFFNESS = 1600;
export const SQUASH_DAMPING = dampingFor(SQUASH_STIFFNESS, 0.4);
export const SQUASH_EPSILON = 0.0005;
const IMPACT_DIVISOR = 220; // arrival px/s per unit of squash velocity
const MAX_IMPACT = 11;

const MAX_STRETCH = 0.22;
const STRETCH_DIVISOR = 6000;

/**
 * A button's position as offsets of its centre from the arena's centre, so the
 * server-rendered CSS position is already the origin. `travel` is the axis the
 * squash compresses along.
 */
export type Body = { x: Spring; y: Spring; squash: Spring; travel: Point };

export type Jitter = { x: number; y: number; tilt: number };

export function createBody(): Body {
  return { x: spring(0), y: spring(0), squash: spring(0), travel: { x: 1, y: 0 } };
}

export function isResting(body: Body): boolean {
  return (
    body.x.velocity === 0 &&
    body.y.velocity === 0 &&
    body.squash.velocity === 0 &&
    body.squash.value === 0
  );
}

/** Squash velocity for arriving at `speed` px/s: negative compresses along travel. */
export function impact(speed: number): number {
  return -Math.min(speed / IMPACT_DIVISOR, MAX_IMPACT);
}

/** Half the button's untransformed size, and the box its centre may move within. */
export function measure(arena: HTMLElement, button: HTMLElement): { half: Point; bounds: Bounds } {
  const half = { x: button.offsetWidth / 2, y: button.offsetHeight / 2 };
  const reachX = Math.max(arena.clientWidth / 2 - half.x - EDGE, 0);
  const reachY = Math.max(arena.clientHeight / 2 - half.y - EDGE, 0);
  return { half, bounds: { minX: -reachX, maxX: reachX, minY: -reachY, maxY: reachY } };
}

/** A pointer event's position as an offset from the arena's centre. */
export function pointIn(arena: HTMLElement, event: { clientX: number; clientY: number }): Point {
  const rect = arena.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  };
}

/**
 * The button's whole transform. It opens with the CSS rest translate so the
 * first write does not jump. Each rotate–scale–unrotate stretches along an
 * axis without turning the label: the first along the velocity, the second
 * along `travel` for the squash. Only the jitter's tilt turns the label.
 */
export function bodyTransform(body: Body, reduced: boolean, jitter?: Jitter): string {
  const speed = Math.hypot(body.x.velocity, body.y.velocity);
  const stretch = reduced ? 0 : Math.min(speed / STRETCH_DIVISOR, MAX_STRETCH);
  const heading = speed > 1 ? Math.atan2(body.y.velocity, body.x.velocity) : 0;
  const travel = Math.atan2(body.travel.y, body.travel.x);
  const q = body.squash.value;
  const x = body.x.value + (jitter?.x ?? 0);
  const y = body.y.value + (jitter?.y ?? 0);
  return (
    `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${jitter?.tilt ?? 0}rad) ` +
    `rotate(${heading}rad) scale(${1 + stretch}, ${1 - stretch}) ` +
    `rotate(${travel - heading}rad) scale(${1 + q}, ${1 - q}) rotate(${-travel}rad)`
  );
}
