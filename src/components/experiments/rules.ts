export const FOG_RADIUS = 188;
export const DITHER_SIZE = 4;
export const FADE_EXPONENT = 0.42;
export const GAUSSIAN_COEFFICIENT = 0.35;

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** The light field's continuous visibility, before ordered dithering. */
export function visibilityAt(distance: number, radius = FOG_RADIUS): number {
  if (radius <= 0) return 0;
  const rho = Math.max(0, distance / radius);
  if (rho >= 1) return 0;

  const edge = Math.pow(1 - rho, FADE_EXPONENT);
  const gaussian = Math.exp(-GAUSSIAN_COEFFICIENT * rho * rho);
  return clamp01(edge * gaussian);
}

/**
 * Returns the black fog's alpha at one low-resolution fog pixel. The smooth
 * field is quantised only toward its edge, where an ordered Bayer pattern
 * keeps the falloff from turning into a single hard contour.
 */
export function fogAlphaAt(
  distance: number,
  pixelX: number,
  pixelY: number,
  phase = 0,
  radius = FOG_RADIUS,
): number {
  const rho = radius <= 0 ? 1 : Math.max(0, distance / radius);
  const coverage = 1 - visibilityAt(distance, radius);
  const edgeWeight = smoothstep(0.46, 0.98, rho) * 0.78;
  const threshold =
    (BAYER_4X4[(pixelY + phase) & (DITHER_SIZE - 1)][(pixelX + phase) & (DITHER_SIZE - 1)] + 0.5) /
    (DITHER_SIZE * DITHER_SIZE);
  const quantised = Math.floor(coverage * 8 + threshold) / 8;
  const alpha = coverage + (quantised - coverage) * edgeWeight;

  return Math.round(clamp01(alpha) * 255);
}
