"use client";

import { useEffect, useId, useRef, useState } from "react";
import buttonStyles from "@/components/buttons/buttons.module.css";
import type { Point } from "@/components/buttons/flee";
import type { ComponentMeta } from "@/components/meta";
import styles from "./buddies.module.css";
import { around, envelope, LOCKED_RADIUS, padded, scream, shake } from "./models";
import { paintEnvelope, placeTab, relative } from "./paint";
import { screamingBuddyPrompt } from "./screaming-buddy.prompt";

function nameOf(el: HTMLElement): string {
  if (el instanceof HTMLInputElement) return el.labels?.[0]?.textContent ?? "";
  return el.textContent ?? "";
}

export function ScreamingBuddy() {
  const [submitted, setSubmitted] = useState(0);
  const nameId = useId();
  const areaRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const cuffEl = envelopeRef.current;
    const tab = tabRef.current;
    if (!area || !cuffEl || !tab) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cuff = envelope(reduced);
    let real: Point | null = null;
    let target: HTMLElement | null = null;
    let since = 0;
    let frame = 0;
    let last = 0;

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!real) {
        cuffEl!.removeAttribute("data-shown");
        tab!.removeAttribute("data-shown");
        frame = 0;
        return;
      }

      const bounds = area!.getBoundingClientRect();
      const locked = target !== null;
      cuff.step(locked ? padded(relative(target!.getBoundingClientRect(), bounds)) : around(real), locked, dt);

      const dwell = now - since;
      tab!.textContent = scream(target ? nameOf(target) : "", dwell);
      const jolt = reduced ? undefined : shake(now, dwell);
      paintEnvelope(cuffEl!, cuff.box(), locked ? LOCKED_RADIUS : undefined, jolt);
      placeTab(tab!, cuff.box(), bounds, jolt);
      cuffEl!.setAttribute("data-shown", "");
      tab!.setAttribute("data-shown", "");

      frame = requestAnimationFrame(tick);
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const bounds = area!.getBoundingClientRect();
      const next = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (!real) {
        cuff.place(around(next));
        since = performance.now();
      }
      real = next;
      wake();
    }

    function onOver(event: PointerEvent) {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>("input, button") : null;
      if (el === target) return;
      target = el;
      since = performance.now();
    }

    function onLeave() {
      real = null;
      target = null;
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

  return (
    <div className={buttonStyles.specimen}>
      <div className={`${buttonStyles.arena} ${styles.stage}`} ref={areaRef} data-sidekick="screaming-buddy">
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted((count) => count + 1);
          }}
        >
          <div className={styles.field}>
            <label htmlFor={nameId}>Name</label>
            <input
              id={nameId}
              className={styles.input}
              name="name"
              autoComplete="off"
              data-sidekick="screaming-name"
            />
          </div>
          <button type="submit" className={`${buttonStyles.button} ${styles.submit}`} data-sidekick="screaming-submit">
            Submit
          </button>
        </form>
        <div className={styles.layer} aria-hidden="true">
          <div className={`${styles.envelope} ${styles.loud}`} ref={envelopeRef} />
          <div className={`${styles.tab} ${styles.loudTab}`} ref={tabRef} />
        </div>
      </div>
      <p className={buttonStyles.readout} role="status" aria-live="polite" aria-atomic="true">
        <span>Submitted</span>
        <span className={buttonStyles.count}>{submitted}</span>
      </p>
    </div>
  );
}

export const screamingBuddyMeta: ComponentMeta = {
  name: "Screaming",
  kind: "hostile",
  category: "buddies",
  summary:
    "A red companion that wraps the field and button in its area and shows each " +
    "one's name in capitals, followed by an A that repeats every 70 milliseconds " +
    "up to eighteen. It shakes harder as the A's accumulate.",
  usage: "<ScreamingBuddy />",
  prompt: screamingBuddyPrompt,
  notes:
    "Between controls it trails the pointer as a 24-pixel circle and shows only the " +
    "A's. The run restarts at one whenever it moves to a new control or the pointer " +
    "re-enters. The system pointer and the form are untouched and fully operable. " +
    "The companion is aria-hidden; submissions are counted in a polite live region. " +
    "Under reduced motion it neither shakes nor springs.",
  lines: {
    "screaming-buddy": "It is always like this.",
    "screaming-name": "Everything here gets read out.",
    "screaming-submit": "Nothing here is urgent.",
  },
};
