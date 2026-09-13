export const UPLOAD_TICK_MS = 250;
/** The share of the remaining distance each tick covers. */
export const UPLOAD_SHARE = 0.1;
/** Below this much remaining, the display cannot change, so ticking stops. */
export const UPLOAD_STALL = 0.1;
export const UPLOAD_CEILING = 99.9;

export function advanceUpload(remaining: number): number {
  return remaining * (1 - UPLOAD_SHARE);
}

/** Percent complete, floored to one decimal and never above 99.9. */
export function displayedPercent(remaining: number): number {
  return Math.min(Math.floor((100 - remaining) * 10 + 1e-9) / 10, UPLOAD_CEILING);
}

/** Whole seconds left at the rate the last tick moved. */
export function secondsRemaining(remaining: number): number {
  const perSecond = (remaining * UPLOAD_SHARE) / (UPLOAD_TICK_MS / 1000);
  return Math.ceil(remaining / perSecond - 1e-9);
}

export const TOAST_MS = 5000;
export const SAVE_MS = 900;
