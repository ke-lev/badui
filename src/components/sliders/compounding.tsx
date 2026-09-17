"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { compoundingPrompt } from "./compounding.prompt";
import { nudgeSpeed, roundSpeed, scaleSpeed, SPEED_MAX, SPEED_MIN } from "./rules";
import styles from "./sliders.module.css";

export function Compounding() {
  // Held unrounded, so small changes accumulate below the displayed decimal.
  const [speed, setSpeed] = useState(1);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef<number | null>(null);
  const labelId = useId();
  const shown = roundSpeed(speed);

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (lastX.current === null) return;
    const dx = event.clientX - lastX.current;
    lastX.current = event.clientX;
    setSpeed((current) => scaleSpeed(current, dx));
  }

  function stop() {
    lastX.current = null;
    setDragging(false);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    let direction: 1 | -1 | 0 = 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") direction = 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") direction = -1;
    if (!direction) return;
    event.preventDefault();
    const step = direction;
    setSpeed((current) => nudgeSpeed(current, step));
  }

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <span id={labelId}>Pointer speed</span>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="5.75" y="2.75" width="8.5" height="14.5" rx="4.25" stroke="currentColor" strokeWidth="1.25" />
          <path d="M10 5.5v3" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </div>
      <p className={styles.reading} aria-hidden="true">{shown.toFixed(1)}×</p>
      <div className={styles.track}>
        <div
          className={`${styles.customRange} ${dragging ? styles.grabbing : ""}`}
          role="slider"
          data-sidekick="speed-slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-orientation="horizontal"
          aria-valuemin={SPEED_MIN}
          aria-valuemax={SPEED_MAX}
          aria-valuenow={shown}
          aria-valuetext={`${shown.toFixed(1)} times`}
          onKeyDown={handleKey}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.focus({ preventScroll: true });
            lastX.current = event.clientX;
            setDragging(true);
          }}
          onPointerMove={drag}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
        >
          <span className={styles.rail} aria-hidden="true" />
          <span className={styles.lane} aria-hidden="true">
            <span
              className={styles.thumb}
              style={{ left: `${((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100}%` }}
            />
          </span>
        </div>
        <div className={styles.endpoints} aria-hidden="true"><span>Slow</span><span>Fast</span></div>
      </div>
    </div>
  );
}

export const compoundingMeta: ComponentMeta = {
  name: "Compounding",
  kind: "hostile",
  category: "sliders",
  summary:
    "A pointer speed setting from 0.1× to 10×, dragged relative to where it " +
    "is pressed. Each pixel of horizontal drag scales the value by about 2% of " +
    "itself, so the thumb moves slowly near 0.1× and quickly near 10×. Each " +
    "arrow-key press scales it by 10%.",
  usage: "<Compounding />",
  prompt: compoundingPrompt,
  notes:
    "A role=slider driven by pointer capture; pressing does not move the " +
    "thumb. The value is held unrounded and shown to one decimal, with " +
    "aria-valuetext in times.",
  lines: {
    "speed-slider": "It takes its own advice.",
  },
};
