/** Spacing of the fog's dot lattice, in CSS pixels. */
export const DOT_PITCH = 6;
/** A fully fogged dot's radius; wide enough that neighbouring dots overlap and cover the ground. */
export const COVER_RADIUS = 4.4;
/** Radius of the pip drawn on each fully fogged dot. */
export const PIP_RADIUS = 0.9;
/** The coverage below which a dot's pip is gone. */
export const PIP_FADE = 0.4;
/** The light's radius as a fraction of the fogged area's shorter side. */
export const RADIUS_RATIO = 0.3;
export const MIN_RADIUS = 64;
/** The fraction of the radius the light leaves fully clear before its edge falls away. */
export const CLEAR_CORE = 0.55;
/** The most clarity ground already crossed keeps once the light has moved on. */
export const MEMORY_CLARITY = 0.6;
/** Seconds for crossed ground to lose half of what it remembers, at the light's edge and inside it. */
export const NEAR_HALF_LIFE = 6;
/** The same, at FAR_REACH radii from the light and beyond. */
export const FAR_HALF_LIFE = 0.6;
/** Distance from the light, in radii, from which crossed ground fogs over fastest. */
export const FAR_REACH = 3.5;
/** Remembered values below this are dropped, so the loop can come to rest. */
export const MEMORY_FLOOR = 0.02;
/** Each dot's half-life is scaled by a fixed factor between 1 − SPREAD / 2 and 1 + SPREAD / 2. */
export const MEMORY_SPREAD = 0.6;
/** How far the light pushes a dot at its edge, in CSS pixels. */
export const PUSH_DISTANCE = 10;
/** Width of the push's falloff either side of the light's edge, in radii. */
export const PUSH_WIDTH = 0.5;
/** Spring constants for a dot's offset from its lattice point. */
export const DOT_STIFFNESS = 170;
export const DOT_DAMPING_RATIO = 0.55;
/** Seconds the fog takes to move between Fog and Spray. */
export const MODE_DURATION = 0.3;
/** Spray: the brush's radius as a fraction of the light's. */
export const BRUSH_RATIO = 0.7;
/** Spray: map dots laid per CSS pixel the pointer moves. */
export const SPRAY_RATE = 1.2;
/** Spray: the core's radius as a fraction of the brush's. */
export const CORE_RATIO = 0.4;
/** Spray: extra map dots laid per CSS pixel the pointer moves, spread evenly across the core. */
export const CORE_RATE = 4;
/** Spray: spring constants for a map dot's scale as it lands or leaves. */
export const POP_STIFFNESS = 260;
export const POP_DAMPING_RATIO = 0.45;
/** Spray: distance, in brush radii, past which a laid dot leaves. */
export const FORGET_REACH = 2.5;
/** Spray: each dot's forget distance is scaled by a fixed factor between 1 − SPREAD / 2 and 1 + SPREAD / 2. */
export const FORGET_SPREAD = 0.4;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The light's radius for a fogged area of the given size. */
export function lightRadius(width: number, height: number): number {
  return Math.max(MIN_RADIUS, Math.min(width, height) * RADIUS_RATIO);
}

/**
 * How clear the light leaves a point `distance` from its centre: 1 across the
 * clear core, easing to 0 at the radius.
 */
export function visibilityAt(distance: number, radius: number): number {
  if (radius <= 0) return 0;
  const t = clamp01((distance / radius - CLEAR_CORE) / (1 - CLEAR_CORE));
  return 1 - t * t * (3 - 2 * t);
}

/**
 * The half-life of crossed ground `distance` from the light: NEAR_HALF_LIFE
 * out to the radius, easing down to FAR_HALF_LIFE at FAR_REACH radii, so the
 * fog closes in from far away first.
 */
export function memoryHalfLife(distance: number, radius: number): number {
  if (radius <= 0) return FAR_HALF_LIFE;
  const t = clamp01((distance / radius - 1) / (FAR_REACH - 1));
  return NEAR_HALF_LIFE + (FAR_HALF_LIFE - NEAR_HALF_LIFE) * t * t * (3 - 2 * t);
}

/** The factor remembered clarity keeps across `dt` seconds. */
export function memoryDecay(dt: number, halfLife: number): number {
  return Math.pow(0.5, Math.max(0, dt) / halfLife);
}

/** A repeatable pseudo-random value in [0, 1] for one lattice point. */
export function latticeHash(ix: number, iy: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** The fixed factor on one dot's memory half-life, so crossed ground fogs over unevenly. */
export function halfLifeScale(column: number, row: number): number {
  return 1 - MEMORY_SPREAD / 2 + MEMORY_SPREAD * latticeHash(column, row);
}

/** How clear one dot is, from the light on it and what it remembers. */
export function dotClarity(lit: number, remembered: number): number {
  return clamp01(Math.max(lit, remembered * MEMORY_CLARITY));
}

/** Moves the Fog-to-Spray mix linearly toward `target`, taking MODE_DURATION end to end. */
export function stepMix(mix: number, target: number, dt: number): number {
  const change = Math.max(0, dt) / MODE_DURATION;
  return mix < target ? Math.min(target, mix + change) : Math.max(target, mix - change);
}

/** The mix eased in and out, as drawn. */
export function easeMix(mix: number): number {
  const t = clamp01(mix);
  return t * t * (3 - 2 * t);
}

/** The radius of a dot of the given clarity. */
export function coverRadius(clarity: number): number {
  return (1 - clamp01(clarity)) * COVER_RADIUS;
}

/** The radius of a laid map dot at the given scale; the scale may overshoot 1 as it lands. */
export function mapDotRadius(scale: number): number {
  return Math.max(0, scale) * COVER_RADIUS;
}

/** The spray brush's radius for a given light radius. */
export function brushRadius(light: number): number {
  return light * BRUSH_RATIO;
}

/**
 * How many dots a move of `distance` pixels lays, carrying the fraction left
 * over into the next move.
 */
export function sprayCount(
  distance: number,
  carry: number,
  rate: number = SPRAY_RATE,
): { count: number; carry: number } {
  const total = carry + Math.max(0, distance) * rate;
  const count = Math.floor(total);
  return { count, carry: total - count };
}

/**
 * Where one sprayed dot lands relative to the pointer, from two uniform random
 * numbers in [0, 1). Distance from the pointer is linear in `u`, so the spray
 * is densest at its centre.
 */
export function sprayOffset(u: number, v: number, brush: number): { x: number; y: number } {
  const distance = brush * clamp01(u);
  const angle = Math.PI * 2 * v;
  return { x: distance * Math.cos(angle), y: distance * Math.sin(angle) };
}

/**
 * Where one core dot lands relative to the pointer, from two uniform random
 * numbers in [0, 1). Distance grows with √u, so the core fills evenly.
 */
export function coreOffset(u: number, v: number, brush: number): { x: number; y: number } {
  const distance = brush * CORE_RATIO * Math.sqrt(clamp01(u));
  const angle = Math.PI * 2 * v;
  return { x: distance * Math.cos(angle), y: distance * Math.sin(angle) };
}

/** How far the pointer may be from one laid dot before it leaves. */
export function forgetDistance(brush: number, column: number, row: number): number {
  return brush * FORGET_REACH * (1 - FORGET_SPREAD / 2 + FORGET_SPREAD * latticeHash(column + 911, row + 353));
}

/** The radius of the pip on a dot of the given clarity. */
export function pipRadius(clarity: number): number {
  return PIP_RADIUS * clamp01((1 - clamp01(clarity) - PIP_FADE) / (1 - PIP_FADE));
}

/** How far the light pushes a dot `distance` from its centre, peaking at the light's edge. */
export function pushAt(distance: number, radius: number): number {
  if (radius <= 0) return 0;
  const t = (distance / radius - 1) / PUSH_WIDTH;
  return PUSH_DISTANCE * Math.exp(-t * t);
}
