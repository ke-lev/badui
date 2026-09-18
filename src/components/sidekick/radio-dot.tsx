"use client";

import { useEffect, useRef } from "react";
import styles from "./sidekick.module.css";
import { prefersReducedMotion } from "@/components/reduced-motion";
import {
  advance,
  DAMPING_LOCK,
  dampingFor,
  foldedHeading,
  MAX_STRETCH,
  settle,
  spring,
  STIFFNESS_LOCK,
  STRETCH_DIVISOR,
} from "./spring";

// One dot per radio group, drawn over whichever input is checked. It travels
// between inputs on the cuff's locked spring — the same arrival, overshoot and
// stretch — rather than each input painting its own. Placed as a direct child
// of the group's fieldset, which must be positioned.
export function RadioDot({ value }: { value: string }) {
  const dotRef = useRef<HTMLSpanElement>(null);
  const placeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const dot = dotRef.current;
    const group = dot?.parentElement;
    if (!dot || !group) return;

    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    const damping = dampingFor(STIFFNESS_LOCK, DAMPING_LOCK);
    const x = spring(0);
    const y = spring(0);
    let placed = false;
    // Only a change the visitor made travels. The hydration pass that swaps the
    // server's checked value for the stored one lands in place.
    let travel = false;
    let frame = 0;
    let last = 0;

    function target() {
      const input = group!.querySelector<HTMLInputElement>("input:checked");
      if (!input) return null;
      const g = group!.getBoundingClientRect();
      const r = input.getBoundingClientRect();
      return { x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2 };
    }

    function paint() {
      const speed = Math.hypot(x.velocity, y.velocity);
      const stretch = prefersReducedMotion() ? 0 : Math.min(speed / STRETCH_DIVISOR, MAX_STRETCH);
      const heading = foldedHeading(x.velocity, y.velocity);
      dot!.style.transform =
        `translate3d(${x.value}px, ${y.value}px, 0) translate(-50%, -50%) ` +
        `rotate(${heading}rad) scale(${1 + stretch}, ${1 - stretch})`;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = target();
      if (!t) {
        frame = 0;
        return;
      }
      advance(x, t.x, dt, STIFFNESS_LOCK, damping);
      advance(y, t.y, dt, STIFFNESS_LOCK, damping);
      paint();
      const resting = x.velocity === 0 && y.velocity === 0 && x.value === t.x && y.value === t.y;
      frame = resting ? 0 : requestAnimationFrame(tick);
    }

    function place() {
      const t = target();
      dot!.hidden = !t;
      if (!t) return;
      if (!placed || prefersReducedMotion() || !travel) {
        cancelAnimationFrame(frame);
        frame = 0;
        settle(x, t.x);
        settle(y, t.y);
        paint();
        placed = true;
        group!.setAttribute("data-dot", "");
      } else if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
      travel = false;
    }

    // Captured on click rather than change: React commits the new value from
    // its own click handler, which can flush before the change event fires.
    // Arrow keys and label clicks both arrive as a click on the input.
    function onClick() {
      travel = true;
    }

    // Turning the preference on mid-travel seats the dot where it was heading;
    // turning it off leaves the dot alone until the next choice travels.
    function onMotionChange() {
      if (!prefersReducedMotion()) return;
      travel = false;
      place();
    }

    // Layout moves (a resize, the font arriving) re-seat the dot without travel.
    function onResize() {
      if (frame) return;
      travel = false;
      place();
    }

    placeRef.current = place;
    place();
    group.addEventListener("click", onClick, true);
    window.addEventListener("resize", onResize);
    motion?.addEventListener("change", onMotionChange);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    observer?.observe(group);

    return () => {
      cancelAnimationFrame(frame);
      group.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", onResize);
      motion?.removeEventListener("change", onMotionChange);
      observer?.disconnect();
      group.removeAttribute("data-dot");
      placeRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    placeRef.current();
  }, [value]);

  return <span className={styles.dot} ref={dotRef} aria-hidden="true" hidden />;
}
