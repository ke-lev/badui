"use client";

import { useEffect, useRef, useState } from "react";
import buttonStyles from "@/components/buttons/buttons.module.css";
import type { ComponentMeta } from "@/components/meta";
import { nearestIndex } from "./models";
import { nearestTargetPrompt } from "./nearest-target.prompt";
import styles from "./cursor.module.css";

const REACH = 40;
const TRACKS = 5;

export function NearestTarget() {
  const [track, setTrack] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [near, setNear] = useState(-1);
  const areaRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const controls = controlsRef.current;
    if (!area || !controls) return;

    const buttons = () => Array.from(controls.querySelectorAll("button"));
    let current = -1;

    function locate(event: PointerEvent) {
      const boxes = buttons().map((button) => button.getBoundingClientRect());
      current = nearestIndex({ x: event.clientX, y: event.clientY }, boxes, REACH);
      setNear(current);
    }

    function onLeave() {
      current = -1;
      setNear(-1);
    }

    // A click on a button is the button's own; a click beside one is handed to it.
    function onClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest("button")) return;
      buttons()[current]?.click();
    }

    area.addEventListener("pointermove", locate, { passive: true });
    area.addEventListener("pointerdown", locate);
    area.addEventListener("pointerleave", onLeave);
    area.addEventListener("click", onClick);

    return () => {
      area.removeEventListener("pointermove", locate);
      area.removeEventListener("pointerdown", locate);
      area.removeEventListener("pointerleave", onLeave);
      area.removeEventListener("click", onClick);
    };
  }, []);

  const step = (direction: 1 | -1) => setTrack((value) => ((value - 1 + direction + TRACKS) % TRACKS) + 1);

  return (
    <div className={buttonStyles.specimen}>
      <div
        className={styles.transport}
        ref={areaRef}
        data-sidekick="nearest-target"
        data-reach={near >= 0 ? "" : undefined}
      >
        <div className={styles.controls} ref={controlsRef} role="group" aria-label="Playback">
          <button
            type="button"
            className={styles.control}
            aria-label="Previous track"
            data-sidekick="nearest-previous"
            data-near={near === 0 ? "" : undefined}
            onClick={() => step(-1)}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 2h1.5v8H2zM10 2v8L4.5 6z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.control} ${styles.primary}`}
            aria-label={playing ? "Pause" : "Play"}
            data-sidekick="nearest-play"
            data-near={near === 1 ? "" : undefined}
            onClick={() => setPlaying((value) => !value)}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              {playing ? (
                <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />
              ) : (
                <path d="M3.5 1.5v9L10 6z" fill="currentColor" />
              )}
            </svg>
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label="Next track"
            data-sidekick="nearest-next"
            data-near={near === 2 ? "" : undefined}
            onClick={() => step(1)}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M8.5 2H10v8H8.5zM2 2v8l5.5-4z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
        <span>
          Track {track} of {TRACKS}
        </span>
        <span className={styles.state}>{playing ? "Playing" : "Paused"}</span>
      </p>
    </div>
  );
}

export const nearestTargetMeta: ComponentMeta = {
  name: "Nearest target",
  kind: "benign",
  category: "cursor",
  summary:
    "A three-button playback control whose buttons answer to clicks near them, " +
    "not only on them. Within 40 pixels of the controls, the nearest button is " +
    "ringed, the pointer becomes a hand, and a click presses that button.",
  usage: "<NearestTarget />",
  prompt: nearestTargetPrompt,
  notes:
    "Distance is measured to each button's edge, so the button under the " +
    "pointer is always the nearest; ties go to the earlier button. The buttons " +
    "are native, labelled, and in one group; Play changes its name to Pause " +
    "while playing. Track and state are announced in a polite live region.",
  lines: {
    "nearest-target": "Close counts.",
    "nearest-previous": "Back one.",
    "nearest-play": "The one in the middle.",
    "nearest-next": "Forward one.",
  },
};
