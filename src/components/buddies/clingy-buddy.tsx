"use client";

import { useEffect, useRef, useState } from "react";
import buttonStyles from "@/components/buttons/buttons.module.css";
import { advance, dampingFor, spring, type Point } from "@/components/buttons/flee";
import type { ComponentMeta } from "@/components/meta";
import styles from "./buddies.module.css";
import { clingyBuddyPrompt } from "./clingy-buddy.prompt";
import {
  around,
  clingOffset,
  envelope,
  HOLD_STIFFNESS,
  LOCKED_RADIUS,
  padded,
  SNAP_RATIO,
  SNAP_STIFFNESS,
  type Box,
} from "./models";
import { paintEnvelope } from "./paint";
import { prefersReducedMotion } from "@/components/reduced-motion";

export function ClingyBuddy() {
  const [counts, setCounts] = useState<[number, number]>([0, 0]);
  const areaRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const leaveRef = useRef<HTMLButtonElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const stay = stayRef.current;
    const leave = leaveRef.current;
    const cuffEl = envelopeRef.current;
    if (!area || !stay || !leave || !cuffEl) return;

    const cuff = envelope(prefersReducedMotion);
    const buttons = [stay, leave];
    const offsets = buttons.map(() => ({ x: spring(0), y: spring(0) }));
    const holdDamping = dampingFor(HOLD_STIFFNESS, 1);
    const snapDamping = dampingFor(SNAP_STIFFNESS, SNAP_RATIO);
    let real: Point | null = null;
    let held = -1;
    let frame = 0;
    let last = 0;

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const bounds = area!.getBoundingClientRect();
      let settled = true;
      const boxes: Box[] = [];

      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const offset = offsets[index];
        const home = {
          x: rect.left + rect.width / 2 - bounds.left - offset.x.value,
          y: rect.top + rect.height / 2 - bounds.top - offset.y.value,
        };
        let goal: Point = { x: 0, y: 0 };
        if (index === held && real) {
          const pull = clingOffset(home, real);
          if (pull) goal = pull;
          else held = -1;
        }
        if (prefersReducedMotion()) {
          offset.x.value = goal.x;
          offset.y.value = goal.y;
        } else {
          const stiffness = index === held ? HOLD_STIFFNESS : SNAP_STIFFNESS;
          const damping = index === held ? holdDamping : snapDamping;
          advance(offset.x, goal.x, dt, stiffness, damping);
          advance(offset.y, goal.y, dt, stiffness, damping);
        }
        if (
          offset.x.velocity !== 0 ||
          offset.y.velocity !== 0 ||
          offset.x.value !== goal.x ||
          offset.y.value !== goal.y
        ) {
          settled = false;
        }
        button.style.transform = `translate(-50%, -50%) translate3d(${offset.x.value}px, ${offset.y.value}px, 0)`;
        boxes.push({
          x: home.x + offset.x.value - rect.width / 2,
          y: home.y + offset.y.value - rect.height / 2,
          w: rect.width,
          h: rect.height,
        });
      });

      if (real) {
        const locked = held >= 0;
        cuff.step(locked ? padded(boxes[held]) : around(real), locked, dt);
        paintEnvelope(cuffEl!, cuff.box(), locked ? LOCKED_RADIUS : undefined);
      }
      cuffEl!.toggleAttribute("data-shown", real !== null);

      frame = real || !settled ? requestAnimationFrame(tick) : 0;
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

    function onOver(event: PointerEvent) {
      const el = event.target instanceof Element ? event.target.closest("button") : null;
      const index = el ? buttons.indexOf(el) : -1;
      if (index >= 0 && held < 0) held = index;
      wake();
    }

    function onLeave() {
      real = null;
      held = -1;
      wake();
    }

    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerdown", onPointer);
    area.addEventListener("pointerover", onOver, { passive: true });
    area.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onPointer);
      area.removeEventListener("pointerdown", onPointer);
      area.removeEventListener("pointerover", onOver);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const press = (index: 0 | 1) =>
    setCounts((current) => {
      const next: [number, number] = [...current];
      next[index] += 1;
      return next;
    });

  return (
    <div className={buttonStyles.specimen}>
      <div className={`${buttonStyles.arena} ${styles.stage}`} ref={areaRef} data-sidekick="clingy-buddy">
        <button
          type="button"
          className={`${buttonStyles.button} ${styles.stay}`}
          ref={stayRef}
          data-sidekick="clingy-stay"
          onClick={() => press(0)}
        >
          Stay
        </button>
        <button
          type="button"
          className={`${buttonStyles.button} ${styles.leave}`}
          ref={leaveRef}
          data-sidekick="clingy-leave"
          onClick={() => press(1)}
        >
          Leave
        </button>
        <div className={styles.layer} aria-hidden="true">
          <div className={styles.envelope} ref={envelopeRef} />
        </div>
      </div>
      <p className={buttonStyles.readout} role="status" aria-live="polite" aria-atomic="true">
        <span>
          Stay <span className={buttonStyles.count}>{counts[0]}</span>
        </span>
        <span>
          Leave <span className={buttonStyles.count}>{counts[1]}</span>
        </span>
      </p>
    </div>
  );
}

export const clingyBuddyMeta: ComponentMeta = {
  name: "Clingy",
  kind: "hostile",
  category: "buddies",
  summary:
    "A companion that takes hold of whichever of two buttons the pointer enters and " +
    "pulls it after the pointer, 85% of the distance from its resting place. The hold " +
    "breaks once the pointer is more than 200 pixels away, and the button swings back.",
  usage: "<ClingyBuddy />",
  prompt: clingyBuddyPrompt,
  notes:
    "One button is held at a time, and only on entry. The held button follows on a " +
    "stiff, critically damped spring and returns on a loose one with a damping ratio " +
    "of 0.35. Both buttons are native and receive real clicks wherever they are drawn; " +
    "presses are counted in a polite live region. Under reduced motion positions " +
    "apply without springing.",
  lines: {
    "clingy-buddy": "It gets attached.",
    "clingy-stay": "It would like that.",
    "clingy-leave": "Further than it looks.",
  },
};
