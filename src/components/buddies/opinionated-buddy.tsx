"use client";

import { useEffect, useRef, useState } from "react";
import buttonStyles from "@/components/buttons/buttons.module.css";
import { advance, dampingFor, spring, type Point } from "@/components/buttons/flee";
import cursorStyles from "@/components/cursor/cursor.module.css";
import { PointerGlyph } from "@/components/cursor/drawn-pointer";
import { nearestIndex } from "@/components/cursor/models";
import type { ComponentMeta } from "@/components/meta";
import styles from "./buddies.module.css";
import {
  around,
  contains,
  envelope,
  LOCKED_RADIUS,
  OPINION_REACH,
  padded,
  SHIFT_STIFFNESS,
  steer,
} from "./models";
import { opinionatedBuddyPrompt } from "./opinionated-buddy.prompt";
import { paintEnvelope, placeTab, relative } from "./paint";

const CHOICES = ["Unsubscribe", "Cancel"] as const;

export function OpinionatedBuddy() {
  const [pressed, setPressed] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const row = rowRef.current;
    const pointer = pointerRef.current;
    const cuffEl = envelopeRef.current;
    const tab = tabRef.current;
    if (!area || !row || !pointer || !cuffEl || !tab) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cuff = envelope(reduced);
    const shift = { x: spring(0), y: spring(0) };
    const damping = dampingFor(SHIFT_STIFFNESS, 1);
    const buttons = Array.from(row.querySelectorAll("button"));
    let real: Point | null = null;
    let hovered = -1;
    let frame = 0;
    let last = 0;

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const bounds = area!.getBoundingClientRect();
      const boxes = buttons.map((button) => button.getBoundingClientRect());

      const avoid = relative(boxes[0], bounds);
      const prefer = relative(boxes[1], bounds);
      let locked = false;
      let goal: Point = { x: 0, y: 0 };
      if (real) {
        const target = steer(real, avoid, prefer);
        if (target) goal = { x: target.x - real.x, y: target.y - real.y };
        locked =
          target !== null ||
          nearestIndex({ x: bounds.left + real.x, y: bounds.top + real.y }, boxes, OPINION_REACH) >= 0;
      }
      if (reduced) {
        shift.x.value = goal.x;
        shift.y.value = goal.y;
      } else {
        advance(shift.x, goal.x, dt, SHIFT_STIFFNESS, damping);
        advance(shift.y, goal.y, dt, SHIFT_STIFFNESS, damping);
      }

      let drawn = real && { x: real.x + shift.x.value, y: real.y + shift.y.value };
      // The slide never carries the pointer across Unsubscribe; it jumps to the goal instead.
      if (real && drawn && contains(avoid, drawn)) {
        shift.x.value = goal.x;
        shift.y.value = goal.y;
        shift.x.velocity = shift.y.velocity = 0;
        drawn = { x: real.x + goal.x, y: real.y + goal.y };
      }
      pointer!.style.visibility = drawn ? "visible" : "hidden";
      if (drawn) pointer!.style.transform = `translate3d(${drawn.x}px, ${drawn.y}px, 0)`;

      hovered = drawn
        ? boxes.findIndex((box) => {
            const x = bounds.left + drawn.x;
            const y = bounds.top + drawn.y;
            return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
          })
        : -1;
      buttons.forEach((button, index) => button.toggleAttribute("data-hover", index === hovered));

      if (drawn) {
        cuff.step(locked ? padded(prefer) : around(drawn), locked, dt);
        paintEnvelope(cuffEl!, cuff.box(), locked ? LOCKED_RADIUS : undefined);
        placeTab(tab!, cuff.box(), bounds);
      }
      cuffEl!.toggleAttribute("data-shown", drawn !== null);
      tab!.toggleAttribute("data-shown", locked);

      frame = real ? requestAnimationFrame(tick) : 0;
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const bounds = area!.getBoundingClientRect();
      const next = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (!real) cuff.place(around(next));
      real = next;
      wake();
    }

    function onLeave() {
      real = null;
      shift.x.value = shift.y.value = 0;
      shift.x.velocity = shift.y.velocity = 0;
      wake();
    }

    // Keyboard activation reaches the area with a button as its target, and is
    // already recorded by that button's own handler.
    function onClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest("button")) return;
      buttons[hovered]?.click();
    }

    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerdown", onPointer);
    area.addEventListener("pointerleave", onLeave);
    area.addEventListener("click", onClick);

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
      <div
        className={`${buttonStyles.arena} ${cursorStyles.area}`}
        ref={areaRef}
        data-sidekick="opinionated-buddy"
      >
        <div className={styles.row} ref={rowRef} role="group" aria-label="Subscription actions">
          {CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`${buttonStyles.button} ${cursorStyles.target} ${styles.choice} ${
                choice === "Unsubscribe" ? styles.danger : ""
              }`}
              onClick={() => setPressed(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
        <div className={styles.layer} aria-hidden="true">
          <div className={styles.envelope} ref={envelopeRef} />
          <div className={styles.tab} ref={tabRef}>
            This one.
          </div>
        </div>
        <div className={cursorStyles.pointer} ref={pointerRef} aria-hidden="true">
          <PointerGlyph />
        </div>
      </div>
      <p className={buttonStyles.readout} role="status" aria-live="polite" aria-atomic="true">
        <span>Last pressed</span>
        <span className={buttonStyles.count}>{pressed ?? "None"}</span>
      </p>
    </div>
  );
}

export const opinionatedBuddyMeta: ComponentMeta = {
  name: "Opinionated",
  kind: "hostile",
  category: "buddies",
  summary:
    "A companion that, whenever the pointer is within 40 pixels of either of two " +
    "buttons, wraps Cancel. Anywhere within 40 pixels of Unsubscribe, the drawn " +
    "pointer is carried to the matching spot inside Cancel, and it never rests on " +
    "or passes over Unsubscribe.",
  usage: "<OpinionatedBuddy />",
  prompt: opinionatedBuddyPrompt,
  notes:
    "The system pointer is hidden and redrawn at the real position plus a shift that " +
    "springs, critically damped, toward its goal; if the spring would put the drawn " +
    "pointer inside Unsubscribe, the shift jumps to the goal. A click presses whichever " +
    "button the drawn pointer is over. The buttons are native and grouped; Tab, " +
    "Enter, and Space operate them directly. The last button pressed is announced in " +
    "a polite live region.",
  lines: {
    "opinionated-buddy": "It knows what you meant.",
  },
};
