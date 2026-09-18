"use client";

import { useEffect, useRef, useState } from "react";
import { Readout } from "@/components/buttons/parts";
import buttonStyles from "@/components/buttons/buttons.module.css";
import type { PointerModel } from "./models";
import styles from "./cursor.module.css";
import { prefersReducedMotion } from "@/components/reduced-motion";

/** Pointer inside an area, `offset` placing the button off centre. */
type Props = {
  model: (isReduced: () => boolean) => PointerModel;
  sidekick: string;
  label: string;
  offset?: boolean;
};

/**
 * An area that hides the real pointer and draws one where `model` says. The
 * button inside ignores the real pointer; a click anywhere in the area presses
 * it only when the drawn pointer is over it. Keyboard activation is native.
 */
export function DrawnPointerArea({ model, sidekick, label, offset = false }: Props) {
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const arena = arenaRef.current;
    const pointer = pointerRef.current;
    const button = buttonRef.current;
    if (!arena || !pointer || !button) return;

    const state = model(prefersReducedMotion);
    let at: { x: number; y: number } | null = null;
    let frame = 0;
    let last = 0;

    function over(): boolean {
      if (!at) return false;
      const area = arena!.getBoundingClientRect();
      const box = button!.getBoundingClientRect();
      const x = area.left + at.x;
      const y = area.top + at.y;
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const next = state.step(now, dt, { width: arena!.clientWidth, height: arena!.clientHeight });
      at = next.at;
      pointer!.style.visibility = at ? "visible" : "hidden";
      if (at) pointer!.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      button!.toggleAttribute("data-hover", over());
      frame = next.moving ? requestAnimationFrame(tick) : 0;
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const area = arena!.getBoundingClientRect();
      state.input({ x: event.clientX - area.left, y: event.clientY - area.top }, performance.now());
      wake();
    }

    function onLeave() {
      state.input(null, performance.now());
      wake();
    }

    // Keyboard activation reaches the area with the button as its target, and
    // is already counted by the button's own handler.
    function onClick(event: MouseEvent) {
      if (event.target === button) return;
      if (over()) setPresses((count) => count + 1);
    }

    arena.addEventListener("pointermove", onPointer, { passive: true });
    arena.addEventListener("pointerdown", onPointer);
    arena.addEventListener("pointerleave", onLeave);
    arena.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(frame);
      arena.removeEventListener("pointermove", onPointer);
      arena.removeEventListener("pointerdown", onPointer);
      arena.removeEventListener("pointerleave", onLeave);
      arena.removeEventListener("click", onClick);
    };
  }, [model]);

  return (
    <div className={buttonStyles.specimen}>
      <div className={`${buttonStyles.arena} ${styles.area}`} ref={arenaRef} data-sidekick={sidekick}>
        <button
          type="button"
          className={`${buttonStyles.button} ${styles.target} ${offset ? styles.offset : ""}`}
          ref={buttonRef}
          onClick={() => setPresses((count) => count + 1)}
        >
          {label}
        </button>
        <div className={styles.pointer} ref={pointerRef} aria-hidden="true">
          <PointerGlyph />
        </div>
      </div>
      <Readout presses={presses} />
    </div>
  );
}

/** The drawn arrow; its tip sits 1.5px into the 16 by 22 box. */
export function PointerGlyph() {
  return (
    <svg viewBox="0 0 16 22" width="16" height="22">
      <path
        d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.6-1.1-2.9-6.5h6z"
        style={{ fill: "var(--foreground)", stroke: "var(--on-inverse)" }}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
