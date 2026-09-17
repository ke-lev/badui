"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { inspect } from "./inspect";
import { line, TARGETS } from "./lines";
import styles from "./sidekick.module.css";
import { useSidekickMode } from "./sidekick-mode";
import {
  advance,
  DAMPING_IDLE,
  DAMPING_LOCK,
  dampingFor,
  foldedHeading,
  MAX_STRETCH,
  settle,
  spring,
  STIFFNESS_IDLE,
  STIFFNESS_LOCK,
  STRETCH_DIVISOR,
} from "./spring";

const FINE_POINTER_QUERY = "(pointer: fine) and (hover: hover)";

// react-hooks/set-state-in-effect flags a bare `useEffect(() => setEnabled(...), [])`
// as a cascading-render risk; useSyncExternalStore is the primitive React points to
// for reading a client-only source (matchMedia has no value during SSR) without it.
// Mirrors the pattern already used in ./sidekick-mode.tsx for the same reason.
function subscribeFinePointer(onChange: () => void): () => void {
  const mql = window.matchMedia(FINE_POINTER_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getFinePointerSnapshot(): boolean {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function getFinePointerServerSnapshot(): boolean {
  return false;
}

const IDLE_RADIUS = 12;
const PAD = 6;

const TAB_STIFFNESS_SCALE = 0.75; // the tab trails the cuff slightly

const LOCK_BLEND = 0.22;
const FADE_BLEND = 0.35;
const TAB_GAP = 9;
const TAB_HEIGHT = 26;
const TAB_CLEARANCE = 80;

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function blend(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.pow(1 - rate, dt * 60));
}

// Resolved against the element's own box: getComputedStyle returns a percentage
// verbatim ("50%"), so parseFloat alone turns a circle into a 50px corner.
function radiusOf(el: Element, rect: DOMRect): number {
  const raw = getComputedStyle(el).borderTopLeftRadius;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 8;
  const base = raw.endsWith("%") ? (parsed / 100) * Math.min(rect.width, rect.height) : parsed;
  return base + PAD;
}

export function Sidekick() {
  const { mode } = useSidekickMode();
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getFinePointerServerSnapshot,
  );
  const [text, setText] = useState("");

  const cuffRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Element | null>(null);
  const offRef = useRef<Element | null>(null);
  const textRef = useRef("");
  const pointerRef = useRef({ x: -100, y: -100 });
  const modeRef = useRef(mode);

  // react-hooks/refs flags a render-phase ref write ("Cannot access refs during
  // render"). The rAF loop only ever reads modeRef on a later frame, always
  // after commit, so deferring the write to an effect is behaviourally
  // equivalent here.
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Depending on `mode` directly would tear down and rebuild the loop on every
  // DOM/Talk switch, resetting the cuff to the top-left corner. Only the Off
  // transition should restart it; the loop reads the live mode from modeRef.
  const active = enabled && mode !== "off";

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cuff = cuffRef.current;
    const tab = tabRef.current;
    if (!cuff || !tab) return;

    const box = {
      x: spring(-100),
      y: spring(-100),
      w: spring(IDLE_RADIUS * 2),
      h: spring(IDLE_RADIUS * 2),
    };
    const tabPos = { x: spring(-100), y: spring(-100) };

    let lock = 0;
    let tabAlpha = 0;
    let cuffAlpha = 1;
    let frame = 0;
    let last = performance.now();
    let lastRadiusTarget: Element | null = null;
    let lastRadius = 0;
    // The tab shows `shownTarget`, which lags targetRef through a fade. Swapping
    // the string the instant the pointer crosses into a new element is the hard
    // cut; instead the tab fades out, swaps at the trough, and fades back in.
    let shownTarget: Element | null = null;

    function publish(next: string) {
      if (next === textRef.current) return;
      textRef.current = next;
      setText(next);
    }

    // A component that talks for itself marks its controls data-sidekick-quiet,
    // and the Talk tab stays out of its way there. The cuff still envelops.
    function describe(el: Element): string {
      if (modeRef.current !== "talk") return inspect(el);
      return el.closest("[data-sidekick-quiet]") ? "" : line(el);
    }

    function onPointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }

    // Inside a [data-sidekick-off] region the companion fades out entirely and
    // locks onto nothing, so it cannot cover a component's own pointer effect.
    function onPointerOver(event: PointerEvent) {
      const origin = event.target;
      const el = origin instanceof Element ? origin : null;
      offRef.current = el ? el.closest("[data-sidekick-off]") : null;
      // A [data-sidekick-group] is enveloped as one piece, so the tab clears the
      // whole group instead of landing on the control beside the one hovered.
      targetRef.current = el && !offRef.current
        ? el.closest("[data-sidekick-group]") ?? el.closest(TARGETS)
        : null;
    }

    function onPointerLeave() {
      targetRef.current = null;
      offRef.current = null;
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const el = targetRef.current;
      if (el && !el.isConnected) targetRef.current = null;
      if (offRef.current && !offRef.current.isConnected) offRef.current = null;
      const off = Boolean(offRef.current);

      const locked = Boolean(targetRef.current);

      let tx: number;
      let ty: number;
      let tw: number;
      let th: number;
      let targetRadius: number;

      if (locked && el) {
        const rect = el.getBoundingClientRect();
        tx = rect.left - PAD;
        ty = rect.top - PAD;
        tw = rect.width + PAD * 2;
        th = rect.height + PAD * 2;
        if (el !== lastRadiusTarget) {
          lastRadius = radiusOf(el, rect);
          lastRadiusTarget = el;
        }
        targetRadius = lastRadius;
      } else {
        tx = pointerRef.current.x - IDLE_RADIUS;
        ty = pointerRef.current.y - IDLE_RADIUS;
        tw = IDLE_RADIUS * 2;
        th = IDLE_RADIUS * 2;
        targetRadius = IDLE_RADIUS;
      }

      // Lerped rather than stepped: switching the follow rate the frame the
      // pointer crosses an edge is a felt gear-change at the worst moment.
      lock = reduced ? (locked ? 1 : 0) : blend(lock, locked ? 1 : 0, LOCK_BLEND, dt);
      const morph = smoothstep(lock);
      const stiffness = STIFFNESS_IDLE + (STIFFNESS_LOCK - STIFFNESS_IDLE) * lock;
      const ratio = DAMPING_IDLE + (DAMPING_LOCK - DAMPING_IDLE) * lock;
      const damping = dampingFor(stiffness, ratio);

      // Once faded out, the box waits at the pointer so it reappears there
      // rather than sweeping in from where it vanished.
      if (reduced || (off && cuffAlpha < 0.05)) {
        settle(box.x, tx);
        settle(box.y, ty);
        settle(box.w, tw);
        settle(box.h, th);
      } else {
        advance(box.x, tx, dt, stiffness, damping);
        advance(box.y, ty, dt, stiffness, damping);
        advance(box.w, tw, dt, stiffness, damping);
        advance(box.h, th, dt, stiffness, damping);
      }

      // The radius is derived from the morph, never eased on its own. At
      // morph 0 the shape is a perfect circle or pill at ANY dimensions, so it
      // cannot pass through a geometrically wrong rounded rectangle on the way
      // in — which was most of what read as a flip.
      const round = Math.min(box.w.value, box.h.value) / 2;
      const radius = round + (targetRadius - round) * morph;

      const speed = Math.hypot(box.x.velocity, box.y.velocity);
      const stretch = reduced
        ? 0
        : Math.min(speed / STRETCH_DIVISOR, MAX_STRETCH) * (1 - morph);

      const heading = foldedHeading(box.x.velocity, box.y.velocity);

      // Rotation exists only to orient the stretch, so it is derived from the
      // stretch each frame rather than kept as state — no persistent angle
      // means nothing left to unwind. Squareness is the second factor: rotating
      // a circle is invisible (it only reorients the ellipse), while rotating
      // an inflated rectangle is a somersault. Cubed rather than linear because
      // the lock spring is stiff enough to half-flatten the box within one
      // frame — the cube collapses the orientation ahead of the box.
      const squareness =
        Math.min(box.w.value, box.h.value) / Math.max(box.w.value, box.h.value);
      const orient = squareness * squareness * squareness;
      const rotation = reduced ? 0 : heading * (stretch / MAX_STRETCH) * orient;

      cuff.style.width = `${box.w.value}px`;
      cuff.style.height = `${box.h.value}px`;
      cuff.style.borderRadius = `${radius}px`;
      cuff.style.transform =
        `translate3d(${box.x.value}px, ${box.y.value}px, 0) ` +
        `rotate(${rotation}rad) ` +
        `scale(${1 + stretch}, ${1 - stretch})`;

      // Fade the tab through every target change, and swap the string at the
      // trough so the text never hard-cuts mid-flight.
      const fadeRate = reduced ? 1 : FADE_BLEND;
      cuffAlpha = blend(cuffAlpha, off ? 0 : 1, fadeRate, dt);
      cuff.style.opacity = `${cuffAlpha}`;
      if (targetRef.current !== shownTarget) {
        tabAlpha = blend(tabAlpha, 0, fadeRate, dt);
        if (tabAlpha < 0.05) {
          shownTarget = targetRef.current;
          publish(shownTarget ? describe(shownTarget) : "");
        }
      } else {
        if (shownTarget) publish(describe(shownTarget));
        tabAlpha = blend(tabAlpha, textRef.current ? 1 : 0, fadeRate, dt);
      }

      // [data-sidekick-tab="above"] prefers the top edge, for targets whose
      // bottom edge runs straight into more of the component.
      const below = box.y.value + box.h.value + TAB_GAP;
      const over = box.y.value - TAB_GAP - TAB_HEIGHT;
      const prefersAbove = Boolean(el?.closest('[data-sidekick-tab="above"]'));
      const flip = prefersAbove
        ? over >= TAB_GAP
        : below + TAB_HEIGHT > window.innerHeight - TAB_CLEARANCE;
      const targetTabY = flip ? over : below;
      const targetTabX = Math.max(
        8,
        Math.min(box.x.value, window.innerWidth - tab.offsetWidth - 8),
      );

      if (reduced) {
        settle(tabPos.x, targetTabX);
        settle(tabPos.y, targetTabY);
      } else {
        const tabStiffness = stiffness * TAB_STIFFNESS_SCALE;
        const tabDamping = dampingFor(tabStiffness, ratio);
        advance(tabPos.x, targetTabX, dt, tabStiffness, tabDamping);
        advance(tabPos.y, targetTabY, dt, tabStiffness, tabDamping);
      }

      tab.style.opacity = `${tabAlpha}`;
      tab.style.transform = `translate3d(${tabPos.x.value}px, ${tabPos.y.value}px, 0)`;
    };

    // Painted synchronously so the cuff and tab start at the idle box instead of
    // the CSS default of (0, 0) for the frame or two before the first rAF tick.
    cuff.style.width = `${box.w.value}px`;
    cuff.style.height = `${box.h.value}px`;
    cuff.style.borderRadius = `${IDLE_RADIUS}px`;
    cuff.style.transform = `translate3d(${box.x.value}px, ${box.y.value}px, 0) rotate(0rad) scale(1, 1)`;
    tab.style.opacity = "0";
    tab.style.transform = `translate3d(${tabPos.x.value}px, ${tabPos.y.value}px, 0)`;

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerleave", onPointerLeave);
      targetRef.current = null;
      textRef.current = "";
      setText("");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.cuff} ref={cuffRef} />
      <div
        className={`${styles.tab} ${mode === "talk" ? styles.tabTalk : styles.tabDom}`}
        ref={tabRef}
      >
        {text}
      </div>
    </div>
  );
}
