"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { advance, dampingFor, spring, type Point } from "./flee";
import { Readout } from "./parts";
import { personalSpacePrompt } from "./personal-space.prompt";
import { clipPath, deformedOutline, displace, insideBox, restOutline, type Box } from "./squish";
import styles from "./buttons.module.css";

const LABEL = "Submit";
const HOLE = 26; // radius of the disc kept clear around the pointer
// The button's box reaches this far past the drawn shape on every side, so the
// bulge and the radius spring's overshoot stay inside the area a clip can draw.
const MARGIN = 36;
const REST: Box = { x: MARGIN, y: MARGIN, width: 200, height: 60, radius: 10 };
const STEP = 4; // px between rest samples of the outline
const MAX_SEGMENT = 2; // px, the longest drawn segment once displaced

// The disc's centre trails the pointer, and its radius opens and closes, on
// underdamped springs, so the material wobbles as it gives way.
const CENTER_STIFFNESS = 520;
const CENTER_DAMPING = dampingFor(CENTER_STIFFNESS, 0.5);
const RADIUS_STIFFNESS = 900;
const RADIUS_DAMPING = dampingFor(RADIUS_STIFFNESS, 0.45);
// Letters flatten against the disc no further than this along its radius.
const MIN_RADIAL = 0.35;

type Letter = { el: HTMLElement; at: Point };

export function PersonalSpace() {
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lettersRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const arena = arenaRef.current;
    const button = buttonRef.current;
    const lettersEl = lettersRef.current;
    if (!arena || !button || !lettersEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rest = restOutline(REST, STEP);
    const x = spring(0);
    const y = spring(0);
    const radius = spring(0);
    let target: Point = { x: 0, y: 0 };
    let present = false;
    let letters: Letter[] = [];
    let frame = 0;
    let last = 0;

    // Layout offsets ignore transforms, so this reads the undisturbed label.
    function measureLetters() {
      letters = Array.from(lettersEl!.children, (child) => {
        const el = child as HTMLElement;
        return { el, at: { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 } };
      });
    }

    function closed(): boolean {
      return radius.value === 0 && radius.velocity === 0;
    }

    function paint() {
      // The spring overshoots zero on its way shut; a negative disc is no disc.
      const r = Math.max(radius.value, 0);
      if (r === 0) {
        button!.style.clipPath = "";
        for (const letter of letters) letter.el.style.transform = "";
        return;
      }
      const c = { x: x.value, y: y.value };
      button!.style.clipPath = clipPath(
        deformedOutline(rest, c, r, MAX_SEGMENT),
        c,
        r,
        insideBox(c, REST),
      );
      // Each letter moves with the material at its centre and takes the map's
      // local stretch: shortened along the radius, widened across it.
      for (const { el, at } of letters) {
        const dx = at.x - c.x;
        const dy = at.y - c.y;
        const d = Math.hypot(dx, dy);
        const moved = displace(at, c, r);
        const radial = Math.max(d / Math.sqrt(d * d + r * r), MIN_RADIAL);
        const angle = Math.atan2(dy, dx);
        el.style.transform =
          `translate(${moved.x - at.x}px, ${moved.y - at.y}px) rotate(${angle}rad) ` +
          `scale(${radial}, ${1 / radial}) rotate(${-angle}rad)`;
      }
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const goal = present ? HOLE : 0;

      if (reduced) {
        x.value = target.x;
        y.value = target.y;
        radius.value = goal;
        x.velocity = y.velocity = radius.velocity = 0;
      } else {
        advance(x, target.x, dt, CENTER_STIFFNESS, CENTER_DAMPING);
        advance(y, target.y, dt, CENTER_STIFFNESS, CENTER_DAMPING);
        advance(radius, goal, dt, RADIUS_STIFFNESS, RADIUS_DAMPING);
      }

      paint();
      const settled =
        radius.value === goal &&
        radius.velocity === 0 &&
        x.value === target.x &&
        y.value === target.y &&
        x.velocity === 0 &&
        y.velocity === 0;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const rect = button!.getBoundingClientRect();
      target = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      // A disc that has fully closed opens where the pointer is, rather than
      // sweeping over from wherever it closed. A late font swap can move the
      // letters, so they are re-read then too.
      if (closed()) {
        x.value = target.x;
        y.value = target.y;
        x.velocity = y.velocity = 0;
        measureLetters();
      }
      present = true;
      wake();
    }

    function onLeave() {
      present = false;
      wake();
    }

    measureLetters();
    arena.addEventListener("pointermove", onPointer, { passive: true });
    arena.addEventListener("pointerdown", onPointer);
    arena.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      arena.removeEventListener("pointermove", onPointer);
      arena.removeEventListener("pointerdown", onPointer);
      arena.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.specimen}>
      <div className={styles.arena} ref={arenaRef}>
        <button
          type="button"
          className={`${styles.button} ${styles.squish}`}
          ref={buttonRef}
          data-sidekick="personal-space"
          onClick={() => setPresses((count) => count + 1)}
        >
          <span className={styles.hiddenLabel}>{LABEL}</span>
          <span className={styles.letters} ref={lettersRef} aria-hidden="true">
            {Array.from(LABEL, (letter, index) => (
              <span key={index} className={styles.letter}>
                {letter}
              </span>
            ))}
          </span>
        </button>
        <span className={styles.squishRing} aria-hidden="true" />
      </div>
      <Readout presses={presses} />
    </div>
  );
}

export const personalSpaceMeta: ComponentMeta = {
  name: "Personal space",
  kind: "hostile",
  category: "buttons",
  summary:
    "A Submit button that keeps a disc of 26-pixel radius around the pointer clear " +
    "of itself. Each point of the button at distance r from the pointer is pushed " +
    "straight out to √(r² + 26²): approached from outside, its edge dents inward; " +
    "with the pointer over it, a hole opens there and the outline bulges by the " +
    "area displaced.",
  usage: "<PersonalSpace />",
  prompt: personalSpacePrompt,
  notes:
    "The shape is drawn with clip-path, which also bounds what receives the " +
    "pointer, so the cleared disc is not part of the button. The disc's centre " +
    "follows the pointer on a spring (stiffness 520, damping ratio 0.5) and its " +
    "radius opens and closes on another (stiffness 900, damping ratio 0.45) as the " +
    "pointer enters and leaves the surrounding area. The label's letters move by " +
    "the same map and are flattened along its radius; a visually hidden copy of " +
    "the label is the accessible name. The focus ring is drawn around the " +
    "undisturbed shape. Presses count from any input, in a polite live region. " +
    "Under prefers-reduced-motion the disc follows the pointer without springs.",
  lines: {
    "personal-space": "It moves over to make room for you.",
  },
};
