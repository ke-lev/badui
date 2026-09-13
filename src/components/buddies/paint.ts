import { clamp, type Point } from "@/components/buttons/flee";
import type { Box } from "./models";

const TAB_GAP = 9;
const EDGE = 4;
const STILL: Point = { x: 0, y: 0 };

/** A client rect as a box relative to its area. */
export function relative(rect: DOMRect, area: DOMRect): Box {
  return { x: rect.left - area.left, y: rect.top - area.top, w: rect.width, h: rect.height };
}

/** Round at rest; `radius` once locked onto something. */
export function paintEnvelope(el: HTMLElement, box: Box, radius?: number, jolt = STILL) {
  el.style.width = `${box.w}px`;
  el.style.height = `${box.h}px`;
  el.style.borderRadius = `${radius ?? Math.min(box.w, box.h) / 2}px`;
  el.style.transform = `translate3d(${box.x + jolt.x}px, ${box.y + jolt.y}px, 0)`;
}

/** Below the envelope, or above it near the bottom edge, kept inside the area. */
export function placeTab(tab: HTMLElement, box: Box, area: DOMRect, jolt = STILL) {
  const below = box.y + box.h + TAB_GAP;
  const y = below + tab.offsetHeight > area.height - EDGE ? box.y - TAB_GAP - tab.offsetHeight : below;
  const x = clamp(box.x, EDGE, area.width - tab.offsetWidth - EDGE);
  tab.style.transform = `translate3d(${x + jolt.x}px, ${y + jolt.y}px, 0)`;
}
