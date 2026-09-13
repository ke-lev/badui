export const PAGE_COUNT = 24;
export const RESULTS_PER_PAGE = 3;

/** Next doubles the page, stopping at the last. */
export function nextPage(page: number): number {
  return Math.min(page * 2, PAGE_COUNT);
}

/** Previous halves the page, rounding down, stopping at the first. */
export function previousPage(page: number): number {
  return Math.max(Math.floor(page / 2), 1);
}

/** The order with `item` taken out and put back at the end. */
export function moveToEnd<T>(order: readonly T[], item: T): T[] {
  return [...order.filter((candidate) => candidate !== item), item];
}

/** Crumb indices to draw, with `null` where the folded middle sits. */
export const COLLAPSE_AFTER = 4;

export function visibleCrumbs(length: number, expanded: boolean): Array<number | null> {
  const all = Array.from({ length }, (_, index) => index);
  if (expanded || length <= COLLAPSE_AFTER) return all;
  return [0, null, length - 2, length - 1];
}
