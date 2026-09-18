import { advance, dampingFor, gapTo, spring, type Point } from "@/components/buttons/flee";

export type Size = { width: number; height: number };

/**
 * Where a drawn pointer is, given where the real one has been. Positions are
 * pixels from the area's top-left corner; null means the pointer is outside.
 */
export type PointerModel = {
  /** Records the real pointer, or null once it has left the area. */
  input(real: Point | null, now: number): void;
  /** The drawn position now, and whether it will change again without input. */
  step(now: number, dt: number, size: Size): { at: Point | null; moving: boolean };
};

/** Reflected across the area's vertical centre line. */
export function mirroredModel(): PointerModel {
  let real: Point | null = null;
  return {
    input(next) {
      real = next;
    },
    step(_now, _dt, size) {
      return { at: real && { x: size.width - real.x, y: real.y }, moving: false };
    },
  };
}

export const DELAY = 450;

/** Wherever the real pointer was `delay` milliseconds ago, outside included. */
export function delayedModel(delay = DELAY): PointerModel {
  let samples: { t: number; p: Point | null }[] = [];
  return {
    input(real, now) {
      samples.push({ t: now, p: real });
    },
    step(now) {
      const cutoff = now - delay;
      let shown = -1;
      while (shown + 1 < samples.length && samples[shown + 1].t <= cutoff) shown++;
      if (shown < 0) return { at: null, moving: samples.length > 0 };
      samples = samples.slice(shown);
      return { at: samples[0].p, moving: samples.length > 1 };
    },
  };
}

export const HEAVY_STIFFNESS = 45;
export const HEAVY_RATIO = 0.22;

/**
 * On an underdamped spring toward the real pointer, starting wherever the
 * pointer enters. Critically damped under reduced motion, which is asked for
 * at each step so changing the preference takes effect at once.
 */
export function heavyModel(isReduced: () => boolean): PointerModel {
  const x = spring(0);
  const y = spring(0);
  let real: Point | null = null;
  return {
    input(next) {
      if (next && !real) {
        x.value = next.x;
        y.value = next.y;
        x.velocity = y.velocity = 0;
      }
      real = next;
    },
    step(_now, dt) {
      if (!real) return { at: null, moving: false };
      const damping = dampingFor(HEAVY_STIFFNESS, isReduced() ? 1 : HEAVY_RATIO);
      advance(x, real.x, dt, HEAVY_STIFFNESS, damping);
      advance(y, real.y, dt, HEAVY_STIFFNESS, damping);
      const resting =
        x.velocity === 0 && y.velocity === 0 && x.value === real.x && y.value === real.y;
      return { at: { x: x.value, y: y.value }, moving: !resting };
    },
  };
}

export type Box = { left: number; top: number; right: number; bottom: number };

/** The index of the box nearest the point within `reach` pixels, or -1. Ties go to the earlier box. */
export function nearestIndex(point: Point, boxes: Box[], reach: number): number {
  let best = -1;
  let bestGap = Infinity;
  boxes.forEach((box, index) => {
    const center = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
    const half = { x: (box.right - box.left) / 2, y: (box.bottom - box.top) / 2 };
    const gap = gapTo(point, center, half);
    if (gap <= reach && gap < bestGap) {
      best = index;
      bestGap = gap;
    }
  });
  return best;
}
