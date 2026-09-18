// One query for the whole app, created on first use. Reading `matches` is
// always current, so callers that read it where the value is used follow the
// visitor's preference while the page is open rather than only at mount.
let query: MediaQueryList | null = null;

/** Whether the visitor asks for reduced motion, right now. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  query ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return query.matches;
}
