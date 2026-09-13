"use client";

import { useEffect, useRef, useState } from "react";
import buttonStyles from "@/components/buttons/buttons.module.css";
import type { Point } from "@/components/buttons/flee";
import cursorStyles from "@/components/cursor/cursor.module.css";
import { PointerGlyph } from "@/components/cursor/drawn-pointer";
import type { ComponentMeta } from "@/components/meta";
import styles from "./buddies.module.css";
import { hungryBuddyPrompt } from "./hungry-buddy.prompt";
import { CHEW_AMOUNT, CHEW_HZ, hungryModel } from "./models";

export function HungryBuddy() {
  const [presses, setPresses] = useState(0);
  const [meals, setMeals] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buddyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const pointer = pointerRef.current;
    const button = buttonRef.current;
    const buddy = buddyRef.current;
    if (!area || !pointer || !button || !buddy) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const model = hungryModel();
    let arrow: Point | null = null;
    let eaten = 0;
    let frame = 0;
    let last = 0;

    function over(): boolean {
      if (!arrow) return false;
      const bounds = area!.getBoundingClientRect();
      const box = button!.getBoundingClientRect();
      const x = bounds.left + arrow.x;
      const y = bounds.top + arrow.y;
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const next = model.step(now, dt);
      arrow = next.arrow;
      pointer!.style.visibility = arrow ? "visible" : "hidden";
      if (arrow) pointer!.style.transform = `translate3d(${arrow.x}px, ${arrow.y}px, 0)`;
      button!.toggleAttribute("data-hover", over());

      const eating = next.phase === "eating";
      const chew = eating && !reduced ? 1 + CHEW_AMOUNT * Math.sin((now / 1000) * CHEW_HZ * 2 * Math.PI) : 1;
      const half = next.size / 2;
      buddy!.style.width = `${next.size}px`;
      buddy!.style.height = `${next.size}px`;
      buddy!.style.transform = `translate3d(${next.centre.x - half}px, ${next.centre.y - half}px, 0) scale(${chew})`;
      buddy!.toggleAttribute("data-eating", eating);
      if (next.meals !== eaten) {
        eaten = next.meals;
        setMeals(eaten);
      }
      frame = next.moving ? requestAnimationFrame(tick) : 0;
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const bounds = area!.getBoundingClientRect();
      model.input({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      wake();
    }

    function onLeave() {
      model.input(null);
      wake();
    }

    // Keyboard activation reaches the area with the button as its target, and
    // is already counted by the button's own handler.
    function onClick(event: MouseEvent) {
      if (event.target === button) return;
      if (over()) setPresses((count) => count + 1);
    }

    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerdown", onPointer);
    area.addEventListener("pointerleave", onLeave);
    area.addEventListener("click", onClick);
    wake();

    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onPointer);
      area.removeEventListener("pointerdown", onPointer);
      area.removeEventListener("pointerleave", onLeave);
      area.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={buttonStyles.specimen}>
      <div className={`${buttonStyles.arena} ${cursorStyles.area}`} ref={areaRef} data-sidekick="hungry-buddy">
        <button
          type="button"
          className={`${buttonStyles.button} ${cursorStyles.target}`}
          ref={buttonRef}
          onClick={() => setPresses((count) => count + 1)}
        >
          Continue
        </button>
        <div className={cursorStyles.pointer} ref={pointerRef} aria-hidden="true">
          <PointerGlyph />
        </div>
        <div className={styles.hungry} ref={buddyRef} aria-hidden="true" />
      </div>
      <p className={buttonStyles.readout} role="status" aria-live="polite" aria-atomic="true">
        <span>
          Presses <span className={buttonStyles.count}>{presses}</span>
        </span>
        <span>
          Eaten <span className={buttonStyles.count}>{meals}</span>
        </span>
      </p>
    </div>
  );
}

export const hungryBuddyMeta: ComponentMeta = {
  name: "Hungry",
  kind: "hostile",
  category: "buddies",
  summary:
    "A companion that follows the pointer on a slow, critically damped spring and " +
    "swallows it once within a quarter of its own diameter. The pointer is gone for " +
    "1.4 seconds, and the companion grows by 6 pixels per meal, up to 72.",
  usage: "<HungryBuddy />",
  prompt: hungryBuddyPrompt,
  notes:
    "The system pointer is hidden and redrawn. A click presses the centred Continue " +
    "button only while the drawn pointer is visible and over it. After eating, the " +
    "companion holds still for a further 0.8 seconds, and it does not move while the " +
    "pointer is outside the area. Tab, Enter, and Space operate the button natively. " +
    "Presses and meals are counted in a polite live region; reduced motion removes " +
    "the chewing pulse.",
  lines: {
    "hungry-buddy": "It is always glad to see you.",
  },
};
