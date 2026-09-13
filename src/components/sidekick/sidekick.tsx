"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { inspect } from "./inspect";
import { line } from "./lines";
import styles from "./sidekick.module.css";
import { useSidekickMode } from "./sidekick-mode";

const TARGETS =
  'a[href], button, input, select, textarea, [role="slider"], [role="dialog"], [data-sidekick]';

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
const IDLE_FOLLOW = 0.18;
const LOCK_FOLLOW = 0.3;
const LOCK_BLEND = 0.22;
const SETTLE = 0.05;
const MAX_STRETCH = 0.26;
const STRETCH_DIVISOR = 3200;
const TAB_GAP = 9;
const TAB_HEIGHT = 26;
const TAB_CLEARANCE = 80;

function approach(current: number, target: number, k: number): number {
  const next = current + (target - current) * k;
  return Math.abs(target - next) < SETTLE ? target : next;
}

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
  // DOM/Snark switch, resetting the cuff to the top-left corner. Only the Off
  // transition should restart it; the loop reads the live mode from modeRef.
  const active = enabled && mode !== "off";

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cuff = cuffRef.current;
    const tab = tabRef.current;
    if (!cuff || !tab) return;

    const box = { x: -100, y: -100, w: IDLE_RADIUS * 2, h: IDLE_RADIUS * 2, r: IDLE_RADIUS };
    let lock = 0;
    let angle = 0;
    let frame = 0;
    let last = performance.now();
    let lastRadiusTarget: Element | null = null;
    let lastRadius = 0;

    function publish(next: string) {
      if (next === textRef.current) return;
      textRef.current = next;
      setText(next);
    }

    function onPointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }

    function onPointerOver(event: PointerEvent) {
      const origin = event.target;
      targetRef.current = origin instanceof Element ? origin.closest(TARGETS) : null;
    }

    function onPointerLeave() {
      targetRef.current = null;
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const el = targetRef.current;
      if (el && !el.isConnected) targetRef.current = null;

      const locked = Boolean(targetRef.current);

      let tx: number;
      let ty: number;
      let tw: number;
      let th: number;
      let tr: number;

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
        tr = lastRadius;
        // Re-described every frame so a readout stays live while the element
        // changes underneath the cursor — turning the dial moves aria-valuenow.
        // publish() bails when the string is unchanged, so this is not a
        // per-frame render.
        publish(modeRef.current === "snark" ? line(el) : inspect(el));
      } else {
        tx = pointerRef.current.x - IDLE_RADIUS;
        ty = pointerRef.current.y - IDLE_RADIUS;
        tw = IDLE_RADIUS * 2;
        th = IDLE_RADIUS * 2;
        tr = IDLE_RADIUS;
        publish("");
      }

      const base = locked ? LOCK_FOLLOW : IDLE_FOLLOW;
      const k = reduced ? 1 : 1 - Math.pow(1 - base, dt * 60);

      const previousX = box.x;
      const previousY = box.y;
      box.x = approach(box.x, tx, k);
      box.y = approach(box.y, ty, k);
      box.w = approach(box.w, tw, k);
      box.h = approach(box.h, th, k);
      box.r = approach(box.r, tr, k);

      const lockK = reduced ? 1 : 1 - Math.pow(1 - LOCK_BLEND, dt * 60);
      lock += ((locked ? 1 : 0) - lock) * lockK;

      const dx = box.x - previousX;
      const dy = box.y - previousY;
      const speed = Math.hypot(dx, dy) / Math.max(dt, 0.001);
      const free = 1 - lock;
      const stretch = reduced
        ? 0
        : Math.min(speed / STRETCH_DIVISOR, MAX_STRETCH) * free;
      if (speed > 20) angle = Math.atan2(dy, dx);

      cuff.style.width = `${box.w}px`;
      cuff.style.height = `${box.h}px`;
      cuff.style.borderRadius = `${box.r}px`;
      cuff.style.transform =
        `translate3d(${box.x}px, ${box.y}px, 0) ` +
        `rotate(${angle * free}rad) ` +
        `scale(${1 + stretch}, ${1 - stretch})`;

      const below = box.y + box.h + TAB_GAP;
      const flip = below + TAB_HEIGHT > window.innerHeight - TAB_CLEARANCE;
      const tabY = flip ? box.y - TAB_GAP - TAB_HEIGHT : below;
      const tabX = Math.max(8, Math.min(box.x, window.innerWidth - tab.offsetWidth - 8));
      tab.style.transform = `translate3d(${tabX}px, ${tabY}px, 0)`;
    };

    // Painted synchronously so the cuff and tab start at the idle box's
    // position instead of the CSS default of (0, 0) for the frame or two
    // before the first rAF tick runs.
    cuff.style.width = `${box.w}px`;
    cuff.style.height = `${box.h}px`;
    cuff.style.borderRadius = `${box.r}px`;
    cuff.style.transform = `translate3d(${box.x}px, ${box.y}px, 0) rotate(0rad) scale(1, 1)`;
    tab.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;

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
        className={[
          styles.tab,
          text ? styles.tabVisible : "",
          mode === "snark" ? styles.tabSnark : styles.tabDom,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={tabRef}
      >
        {text}
      </div>
    </div>
  );
}
