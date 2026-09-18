"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import {
  clamp,
  coast,
  LOOSE_KICK,
  LOOSE_MAX_SPEED,
  LOOSE_WINDOW_MS,
  releaseVelocity,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  TEMPERATURE_STEPS,
  temperatureValue,
  type Sample,
} from "./rules";
import styles from "./sliders.module.css";
import { reboundPrompt } from "./rebound.prompt";
import { prefersReducedMotion } from "@/components/reduced-motion";

const INITIAL = 0.55;
/** Half the thumb's width: its centre travels this far inside each end. */
const INSET = 7;

export function Rebound() {
  const [value, setValue] = useState(() => temperatureValue(INITIAL));
  const [dragging, setDragging] = useState(false);
  const labelId = useId();
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  // The thumb moves every frame, so its position lives here and is written to
  // the DOM directly; React state holds only the half-degree value.
  useEffect(() => {
    const slider = sliderRef.current;
    const thumb = thumbRef.current;
    if (!slider || !thumb) return;

    let p = INITIAL;
    let v = 0;
    let frame = 0;
    let last = 0;
    let samples: Sample[] = [];
    let pointer: number | null = null;

    function place(next: number) {
      p = next;
      thumb!.style.left = `${p * 100}%`;
      setValue(temperatureValue(p));
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const next = coast(p, v, dt);
      v = next.v;
      place(next.p);
      frame = v === 0 ? 0 : requestAnimationFrame(tick);
    }

    function launch(velocity: number) {
      v = velocity;
      if (frame || v === 0) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function pointerAt(event: PointerEvent): number {
      const box = slider!.getBoundingClientRect();
      return clamp((event.clientX - box.left - INSET) / (box.width - INSET * 2), 0, 1);
    }

    function onDown(event: PointerEvent) {
      if (event.button !== 0) return;
      slider!.setPointerCapture(event.pointerId);
      slider!.focus({ preventScroll: true });
      pointer = event.pointerId;
      cancelAnimationFrame(frame);
      frame = 0;
      v = 0;
      place(pointerAt(event));
      samples = [{ time: performance.now(), p }];
      setDragging(true);
    }

    function onMove(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      place(pointerAt(event));
      const now = performance.now();
      samples = [...samples, { time: now, p }].filter((sample) => now - sample.time <= LOOSE_WINDOW_MS);
    }

    function end(velocity: number) {
      pointer = null;
      samples = [];
      setDragging(false);
      launch(prefersReducedMotion() ? 0 : velocity);
    }

    function onUp(event: PointerEvent) {
      if (event.pointerId === pointer) end(releaseVelocity(samples, performance.now()));
    }

    // Also reached after a pointerup, by which point the drag has ended.
    function onCancel(event: PointerEvent) {
      if (event.pointerId === pointer) end(0);
    }

    function onKey(event: KeyboardEvent) {
      let direction = 0;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") direction = 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") direction = -1;
      if (!direction) return;
      event.preventDefault();
      if (prefersReducedMotion()) place(clamp(p + direction / TEMPERATURE_STEPS, 0, 1));
      else launch(clamp(v + direction * LOOSE_KICK, -LOOSE_MAX_SPEED, LOOSE_MAX_SPEED));
    }

    slider.addEventListener("pointerdown", onDown);
    slider.addEventListener("pointermove", onMove);
    slider.addEventListener("pointerup", onUp);
    slider.addEventListener("pointercancel", onCancel);
    slider.addEventListener("lostpointercapture", onCancel);
    slider.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      slider.removeEventListener("pointerdown", onDown);
      slider.removeEventListener("pointermove", onMove);
      slider.removeEventListener("pointerup", onUp);
      slider.removeEventListener("pointercancel", onCancel);
      slider.removeEventListener("lostpointercapture", onCancel);
      slider.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <span id={labelId}>Temperature</span>
        <span className={styles.aside}>°C</span>
      </div>
      <p className={styles.reading} aria-hidden="true">{value.toFixed(1)}°</p>
      <div className={styles.track}>
        <div
          ref={sliderRef}
          className={`${styles.customRange} ${dragging ? styles.grabbing : ""}`}
          role="slider"
          data-sidekick="temperature-slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-orientation="horizontal"
          aria-valuemin={TEMPERATURE_MIN}
          aria-valuemax={TEMPERATURE_MAX}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(1)} degrees Celsius`}
        >
          <span className={styles.rail} aria-hidden="true" />
          <span className={styles.lane} aria-hidden="true">
            {/* Positioned by the effect after mount; this is only its start. */}
            <span ref={thumbRef} className={styles.thumb} style={{ left: `${INITIAL * 100}%` }} />
          </span>
        </div>
        <div className={styles.ticks} aria-hidden="true">
          {Array.from({ length: 21 }, (_, index) => <span key={index} className={index % 5 === 0 ? styles.majorTick : ""} />)}
        </div>
        <div className={styles.endpoints} aria-hidden="true"><span>10°</span><span>30°</span></div>
      </div>
    </div>
  );
}

export const reboundMeta: ComponentMeta = {
  name: "Rebound",
  kind: "hostile",
  category: "sliders",
  summary:
    "A temperature slider from 10 to 30 °C in half-degree steps. The thumb " +
    "follows the pointer while held; on release it keeps the speed it was let " +
    "go at, slows under friction, and rebounds off either end at 70% of its " +
    "speed until it comes to rest.",
  usage: "<Rebound />",
  prompt: reboundPrompt,
  notes:
    "A role=slider driven by pointer capture. Release speed is measured over " +
    "the last 100ms of drag and capped at eight track-widths a second; a " +
    "pointer held still for 50ms before release lets go at rest. Each arrow-key " +
    "press adds 0.6 track-widths a second in its direction. Under " +
    "prefers-reduced-motion the thumb stops on release and arrow keys move it " +
    "half a degree.",
  lines: {
    "temperature-slider": "It remembers how it was let go.",
  },
};
