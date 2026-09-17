// Rotary dial geometry. Angles are degrees measured clockwise from twelve
// o'clock; lengths are in the dial's 224-unit SVG space, centred on (112, 112).

/** Where every finger hole comes to rest when pulled all the way round. */
export const STOP_ANGLE = 120;
export const HOLE_SPACING = 30;
export const HOLE_RING = 84;
/** The finger plate's outer edge. */
export const PLATE_RADIUS = 108;
/** The centre card, as far inside the hole ring as the plate edge is outside it. */
export const CARD_RADIUS = 2 * HOLE_RING - PLATE_RADIUS;
export const HOLE_RADIUS = 15;
/** How far short of the stop a release still counts as reaching it. */
export const STOP_TOLERANCE = 5;
/** The dial winds home at this constant speed, degrees per second. */
export const RETURN_SPEED = 300;
/** Keyboard dialing pulls the dial round at this speed, degrees per second. */
export const PULL_SPEED = 600;
export const NUMBER_LENGTH = 10;

/** Finger holes in order round the plate, anticlockwise from the stop. */
export const HOLE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** Degrees a digit's hole travels to reach the stop: 60 for 1, 330 for 0. */
export function travelFor(digit: number): number {
  return HOLE_SPACING * ((digit === 0 ? 10 : digit) + 1);
}

/** A digit's hole angle with the dial at rest. */
export function restAngle(digit: number): number {
  return (((STOP_ANGLE - travelFor(digit)) % 360) + 360) % 360;
}

/** A point on the dial at `angle` and `radius`, in SVG units. */
export function pointAt(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return { x: 112 + Math.sin(radians) * radius, y: 112 - Math.cos(radians) * radius };
}

/** The angle of an offset from the dial's centre. */
export function angleOf(dx: number, dy: number): number {
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
}

/** The signed change from one angle to the next, across the 0/360 seam. */
export function angleDifference(from: number, to: number): number {
  let difference = to - from;
  if (difference > 180) difference -= 360;
  if (difference <= -180) difference += 360;
  return difference;
}

/** The digit whose resting hole contains the SVG point, or null. */
export function holeAt(x: number, y: number): number | null {
  for (const digit of HOLE_DIGITS) {
    const centre = pointAt(restAngle(digit), HOLE_RING);
    if (Math.hypot(x - centre.x, y - centre.y) <= HOLE_RADIUS) return digit;
  }
  return null;
}

/** Rotation after a move: clockwise only as far as the stop, never below rest. */
export function pull(rotation: number, difference: number, travel: number): number {
  return Math.min(travel, Math.max(0, rotation + difference));
}

export function reachedStop(rotation: number, travel: number): boolean {
  return rotation >= travel - STOP_TOLERANCE;
}

/** Rotation `elapsed` milliseconds into a return that began at `from`. */
export function returning(from: number, elapsed: number): number {
  return Math.max(0, from - (RETURN_SPEED * elapsed) / 1000);
}

/** Digits grouped 3–3–4, as far as they go: "555 12". */
export function formatNumber(digits: number[]): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
    .map((group) => group.join(""))
    .filter(Boolean)
    .join(" ");
}
