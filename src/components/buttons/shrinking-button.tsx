"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { pointIn } from "./arena";
import { advance, clamp, dampingFor, gapTo, shrinkFor, spring, type Point } from "./flee";
import { Readout } from "./parts";
import { shrinkingButtonPrompt } from "./shrinking-button.prompt";
import styles from "./buttons.module.css";

const FAR = 16; // full size with the pointer this far from its edge, or farther
const NEAR = 1; // smallest with the pointer this close, or closer
const MIN_SIZE = 3;
const LABEL_FADE = 0.35; // the label is gone by this much of the shrink

// Width and height shrink on separate springs. Height is stiffer and leads, so
// the button narrows through a pill on the way down and fattens on the way up.
const HEIGHT_STIFFNESS = 1100;
const WIDTH_STIFFNESS = 650;
const RATIO = 0.6;
const EPSILON = 0.0005;

export function ShrinkingButton() {
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const arena = arenaRef.current;
    const button = buttonRef.current;
    const label = labelRef.current;
    if (!arena || !button || !label) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = spring(0);
    const height = spring(0);
    const heightDamping = dampingFor(HEIGHT_STIFFNESS, RATIO);
    const widthDamping = dampingFor(WIDTH_STIFFNESS, RATIO);

    const computed = getComputedStyle(button);
    const padding = {
      x: Number.parseFloat(computed.paddingLeft),
      y: Number.parseFloat(computed.paddingTop),
    };
    const radius = Number.parseFloat(computed.borderTopLeftRadius);
    let natural = { x: button.offsetWidth, y: button.offsetHeight };
    let pointer: Point | null = null;
    let frame = 0;
    let last = 0;

    function atRest(): boolean {
      return width.value === 0 && height.value === 0 && width.velocity === 0 && height.velocity === 0;
    }

    // Measured from where its edge is at full size, so shrinking never moves
    // the edge away from the pointer and feeds back into itself.
    function goal(): number {
      if (!pointer) return 0;
      const half = { x: natural.x / 2, y: natural.y / 2 };
      return shrinkFor(gapTo(pointer, { x: 0, y: 0 }, half), NEAR, FAR);
    }

    // Real width, height, and padding rather than a scale, so the pressable
    // area is the drawn one. At rest every override is cleared back to CSS.
    function paint() {
      const s = button!.style;
      if (atRest()) {
        s.width = s.height = s.minHeight = s.padding = s.borderRadius = "";
        label!.style.opacity = "";
        return;
      }
      const w = Math.max(MIN_SIZE, natural.x + (MIN_SIZE - natural.x) * width.value);
      const h = Math.max(MIN_SIZE, natural.y + (MIN_SIZE - natural.y) * height.value);
      s.width = `${w}px`;
      s.height = `${h}px`;
      s.minHeight = "0";
      s.padding =
        `${Math.max(0, padding.y * (1 - height.value))}px ` +
        `${Math.max(0, padding.x * (1 - width.value))}px`;
      s.borderRadius = `${Math.min(radius, h / 2)}px`;
      label!.style.opacity = `${clamp(1 - Math.max(width.value, height.value) / LABEL_FADE, 0, 1)}`;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const g = goal();

      if (reduced) {
        width.value = height.value = g;
        width.velocity = height.velocity = 0;
      } else {
        advance(height, g, dt, HEIGHT_STIFFNESS, heightDamping, EPSILON);
        advance(width, g, dt, WIDTH_STIFFNESS, widthDamping, EPSILON);
      }

      paint();
      const settled =
        width.velocity === 0 && height.velocity === 0 && width.value === g && height.value === g;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      // Re-read only at full size, when no override is applied; a late font
      // swap can change the label's width after mount.
      if (atRest()) natural = { x: button!.offsetWidth, y: button!.offsetHeight };
      pointer = pointIn(arena!, event);
      wake();
    }

    function onLeave() {
      pointer = null;
      wake();
    }

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
          className={`${styles.button} ${styles.shrinking}`}
          ref={buttonRef}
          data-sidekick="shrinking-button"
          onClick={() => setPresses((count) => count + 1)}
        >
          <span className={styles.label} ref={labelRef}>
            Submit
          </span>
        </button>
      </div>
      <Readout presses={presses} />
    </div>
  );
}

export const shrinkingButtonMeta: ComponentMeta = {
  name: "Shrinking",
  kind: "hostile",
  category: "buttons",
  summary:
    "A Submit button that stays in place and shrinks as the pointer approaches: " +
    "full size while the pointer is 16 pixels or more from its edge, and a " +
    "3-by-3-pixel square once the pointer is within 1 pixel of it. It regrows " +
    "as the pointer withdraws.",
  usage: "<ShrinkingButton />",
  prompt: shrinkingButtonPrompt,
  notes:
    "Width, height, and padding shrink rather than a scale transform, so the " +
    "pressable area is the drawn size. Distance is measured from the full-size " +
    "edge. Height leads width, so it passes through a pill shape; the label " +
    "fades over the first third of the shrink and remains the accessible name. " +
    "Presses are counted in a polite live region. Under prefers-reduced-motion " +
    "the size follows the pointer without a spring.",
  lines: {
    "shrinking-button": "It gets smaller the more you mean it.",
  },
};
