import type { Point } from "./flee";

/** A rounded rectangle by its top-left corner, size, and corner radius. */
export type Box = { x: number; y: number; width: number; height: number; radius: number };

/**
 * Where `point` goes when a disc of `radius` is cleared at `center`: straight
 * out from the centre, from distance r to √(r² + radius²). Since r'·dr' = r·dr
 * and the angle is kept, the map preserves area — whatever the disc displaces
 * reappears as a bulge further out — and nothing lands inside the disc.
 */
export function displace(point: Point, center: Point, radius: number): Point {
  if (radius <= 0) return point;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const r = Math.hypot(dx, dy);
  if (r === 0) return { x: center.x, y: center.y - radius };
  const k = Math.sqrt(r * r + radius * radius) / r;
  return { x: center.x + dx * k, y: center.y + dy * k };
}

/** The box's outline, clockwise from the top edge, sampled about every `step` px. */
export function restOutline(box: Box, step: number): Point[] {
  const { x, y, width: w, height: h } = box;
  const r = Math.min(box.radius, w / 2, h / 2);
  const points: Point[] = [];

  function line(ax: number, ay: number, bx: number, by: number) {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let i = 0; i < n; i++) points.push({ x: ax + ((bx - ax) * i) / n, y: ay + ((by - ay) * i) / n });
  }

  function arc(cx: number, cy: number, from: number) {
    const n = Math.max(1, Math.ceil(((Math.PI / 2) * r) / step));
    for (let i = 0; i < n; i++) {
      const a = from + ((Math.PI / 2) * i) / n;
      points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  }

  line(x + r, y, x + w - r, y);
  arc(x + w - r, y + r, -Math.PI / 2);
  line(x + w, y + r, x + w, y + h - r);
  arc(x + w - r, y + h - r, 0);
  line(x + w - r, y + h, x + r, y + h);
  arc(x + r, y + h - r, Math.PI / 2);
  line(x, y + h - r, x, y + r);
  arc(x + r, y + r, Math.PI);
  return points;
}

// Near the disc the map spreads neighbouring samples far apart — a point 1px
// from the centre lands on its rim — so segments are split in rest space until
// their displaced ends are close, not sampled densely everywhere.
const MAX_DEPTH = 10;

/** The rest outline carried through `displace`, no drawn segment longer than `maxSegment`. */
export function deformedOutline(
  rest: Point[],
  center: Point,
  radius: number,
  maxSegment: number,
): Point[] {
  const out: Point[] = [];

  function split(a: Point, A: Point, b: Point, B: Point, depth: number) {
    if (depth >= MAX_DEPTH || Math.hypot(B.x - A.x, B.y - A.y) <= maxSegment) return;
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const M = displace(m, center, radius);
    split(a, A, m, M, depth + 1);
    out.push(M);
    split(m, M, b, B, depth + 1);
  }

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const b = rest[(i + 1) % rest.length];
    const A = displace(a, center, radius);
    out.push(A);
    split(a, A, b, displace(b, center, radius), 0);
  }
  return out;
}

/** Whether `point` lies inside the rounded box. */
export function insideBox(point: Point, box: Box): boolean {
  const r = Math.min(box.radius, box.width / 2, box.height / 2);
  const dx = Math.abs(point.x - (box.x + box.width / 2)) - (box.width / 2 - r);
  const dy = Math.abs(point.y - (box.y + box.height / 2)) - (box.height / 2 - r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) < r;
}

/**
 * A CSS clip-path for the outline. When the centre is inside the shape, the
 * disc is a hole in it, cut by the even-odd rule.
 */
export function clipPath(outline: Point[], center: Point, radius: number, hole: boolean): string {
  let d = `M${outline.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("L")}Z`;
  if (hole && radius > 0) {
    const left = `${(center.x - radius).toFixed(2)} ${center.y.toFixed(2)}`;
    const right = `${(center.x + radius).toFixed(2)} ${center.y.toFixed(2)}`;
    const r = radius.toFixed(2);
    d += `M${left}A${r} ${r} 0 1 0 ${right}A${r} ${r} 0 1 0 ${left}Z`;
  }
  return `path(evenodd, "${d}")`;
}

/** Twice the signed area of a closed polygon; positive when clockwise on screen. */
export function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}
