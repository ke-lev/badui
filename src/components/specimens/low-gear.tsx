"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { lowGearPrompt } from "./low-gear.prompt";
import styles from "./physical-specimens.module.css";

const MAX_ROTATION = 4_500;

export function LowGear() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const previousAngle = useRef<number | null>(null);
  const volume = Math.round(rotation / 45);

  function angleFor(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.atan2(
      event.clientY - rect.top - rect.height / 2,
      event.clientX - rect.left - rect.width / 2,
    ) * (180 / Math.PI);
  }

  function moveDial(event: PointerEvent<HTMLDivElement>) {
    if (previousAngle.current === null) return;
    const next = angleFor(event);
    let difference = next - previousAngle.current;
    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;
    previousAngle.current = next;
    setRotation((current) => Math.min(MAX_ROTATION, Math.max(0, current + difference)));
  }

  function stopDial() {
    previousAngle.current = null;
    setDragging(false);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    let delta = 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") delta = 45;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") delta = -45;
    if (!delta) return;
    event.preventDefault();
    setRotation((current) => Math.min(MAX_ROTATION, Math.max(0, current + delta)));
  }

  return (
    <div className={styles.volumeSpecimen}>
      <div
        className={`${styles.dial} ${dragging ? styles.dragging : ""}`}
        role="slider"
        data-sidekick="volume-dial"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={volume}
        aria-valuetext={`${volume} percent`}
        onKeyDown={handleKey}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          previousAngle.current = angleFor(event);
          setDragging(true);
        }}
        onPointerMove={moveDial}
        onPointerUp={stopDial}
        onPointerCancel={stopDial}
        onLostPointerCapture={stopDial}
      >
        <svg className={styles.dialTicks} viewBox="0 0 224 224" aria-hidden="true">
          {Array.from({ length: 48 }, (_, index) => {
            const angle = (index * Math.PI) / 24;
            const inside = index % 4 === 0 ? 97 : 101;
            return (
              <line
                key={index}
                x1={(112 + Math.sin(angle) * inside).toFixed(3)}
                y1={(112 - Math.cos(angle) * inside).toFixed(3)}
                x2={(112 + Math.sin(angle) * 107).toFixed(3)}
                y2={(112 - Math.cos(angle) * 107).toFixed(3)}
                className={index % 4 === 0 ? styles.majorTick : styles.minorTick}
              />
            );
          })}
        </svg>
        <div className={styles.dialFace}>
          <span className={styles.dialHand} style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
            <span />
          </span>
          <div className={styles.volumeReading}>
            <span className={styles.volumeValue}>{volume}<span className={styles.percent}>%</span></span>
            <span className={styles.volumeLabel}>Volume</span>
          </div>
        </div>
      </div>
      <span className={styles.dialHint}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M12.6 5.6A5 5 0 1 0 13 9M12.6 2.5v3.6H9" stroke="currentColor" strokeWidth="1.25" />
        </svg>
        Turn to adjust
      </span>
    </div>
  );
}

export const lowGearMeta: ComponentMeta = {
  name: "Low gear",
  kind: "hostile",
  category: "sliders",
  summary:
    "A rotary dial read in percent. One full turn of the dial moves it eight " +
    "percent, so reaching 100% takes twelve and a half turns; each arrow-key " +
    "press moves it one percent.",
  usage: "<LowGear />",
  prompt: lowGearPrompt,
  notes:
    "Turned with pointer capture, so the pointer may leave the dial mid-turn. " +
    "Exposed as role=slider from 0 to 100 with aria-valuetext in percent.",
  lines: {
    "volume-dial": "It goes to 100. It does not go to 100 quickly.",
  },
};
