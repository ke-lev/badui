export type Point = { x: number; y: number };

export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type Split = {
  origin: Point;
  first: Point;
  second: Point;
};

function clampAxis(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function clampPoint(point: Point, bounds: Bounds): Point {
  return {
    x: clampAxis(point.x, bounds.minX, bounds.maxX),
    y: clampAxis(point.y, bounds.minY, bounds.maxY),
  };
}

/** The direction from the button's centre to the cursor, with a vertical fallback. */
export function splitAxis(center: Point, cursor: Point): Point {
  const dx = cursor.x - center.x;
  const dy = cursor.y - center.y;
  const length = Math.hypot(dx, dy);
  return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: -1 };
}

export const DIVISION_MS = 600;

/**
 * One step of a division. `travel` is the fraction of the way from the parent's
 * centre to the child's resting centre; `along` and `across` scale the shape
 * relative to the split axis; `neck` scales the bridge between the pair.
 */
export type DivisionStep = {
  offset: number;
  travel: number;
  along: number;
  across: number;
  neck: number;
  easing: string;
};

/** Stretch along the axis, pull apart past the resting point, then settle. */
export const DIVISION_STEPS: readonly DivisionStep[] = [
  { offset: 0, travel: 0, along: 1, across: 1, neck: 0, easing: "cubic-bezier(.3, 0, .4, 1)" },
  { offset: 0.22, travel: 0, along: 1.16, across: 0.9, neck: 1, easing: "cubic-bezier(.5, 0, .2, 1)" },
  { offset: 0.56, travel: 1.08, along: 0.94, across: 1.05, neck: 0.55, easing: "cubic-bezier(.4, 0, .6, 1)" },
  { offset: 0.66, travel: 1.05, along: 0.97, across: 1.02, neck: 0, easing: "cubic-bezier(.4, 0, .6, 1)" },
  { offset: 0.82, travel: 0.98, along: 1.02, across: 0.99, neck: 0, easing: "ease-in-out" },
  { offset: 1, travel: 1, along: 1, across: 1, neck: 0, easing: "linear" },
];

/** Label opacity through a division: hidden while the pair still overlaps. */
export const LABEL_STEPS: readonly { offset: number; opacity: number }[] = [
  { offset: 0, opacity: 1 },
  { offset: 0.16, opacity: 1 },
  { offset: 0.26, opacity: 0 },
  { offset: 0.46, opacity: 0 },
  { offset: 0.6, opacity: 1 },
  { offset: 1, opacity: 1 },
];

/**
 * The neck's length along the split axis: it spans the gap between the pair's
 * facing edges and reaches `overlap` into each, never shorter than `min`.
 */
export function neckLength(
  distance: number,
  extent: number,
  overlap: number,
  min: number,
): number {
  return Math.max(distance - extent + overlap * 2, min);
}

/** The width of a `width` x `height` box measured along the unit vector `axis`. */
export function extentAlong(axis: Point, width: number, height: number): number {
  return Math.abs(axis.x) * width + Math.abs(axis.y) * height;
}

/**
 * A centred transform at `point`, scaled along and across `axis`. Every step
 * uses the same function list so the browser interpolates it component-wise.
 */
export function divisionTransform(
  point: Point,
  axis: Point,
  along: number,
  across: number,
): string {
  const angle = Math.atan2(axis.y, axis.x);
  return (
    `translate(-50%, -50%) translate(${point.x}px, ${point.y}px) ` +
    `rotate(${angle}rad) scale(${along}, ${across}) rotate(${-angle}rad)`
  );
}

export function lerpPoint(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Two child centres straddle the cursor, staying inside the arena's button bounds. */
export function splitAt(
  center: Point,
  cursor: Point,
  bounds: Bounds,
  distance: number,
): Split {
  const origin = clampPoint(cursor, bounds);
  const axis = splitAxis(center, origin);
  return {
    origin,
    first: clampPoint({ x: origin.x - axis.x * distance, y: origin.y - axis.y * distance }, bounds),
    second: clampPoint({ x: origin.x + axis.x * distance, y: origin.y + axis.y * distance }, bounds),
  };
}
