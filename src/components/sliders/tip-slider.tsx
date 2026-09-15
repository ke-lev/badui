"use client";

import { useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { digitWindow, TIP_LAST } from "./rules";
import styles from "./sliders.module.css";
import { tipSliderPrompt } from "./tip-slider.prompt";

export function PiCker() {
  const [position, setPosition] = useState(0);
  const strip = digitWindow(position);

  return (
    <div className={styles.specimen}>
      <div className={styles.track}>
        <p className={`${styles.digits} ${styles.digitsAbove}`} aria-hidden="true">
          <span className={styles.digitBefore}>{strip.before}</span>
          <mark className={styles.digitPair}>{strip.pair}</mark>
          <span className={styles.digitAfter}>{strip.after}</span>
        </p>
        <input
          className={styles.range}
          type="range"
          data-sidekick="picker-slider"
          min={0}
          max={TIP_LAST}
          step={1}
          value={position}
          aria-label="πcker"
          aria-valuetext={`π decimal digits ${strip.pair}`}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

export const piCkerMeta: ComponentMeta = {
  name: "πcker",
  kind: "hostile",
  category: "sliders",
  summary:
    "A range slider with 605 positions through the decimal digits of π. " +
    "Each position selects the next overlapping pair, shown in a digit window above the track.",
  usage: "<PiCker />",
  prompt: tipSliderPrompt,
  notes:
    "A native range input; keyboard movement advances one decimal digit at a time. " +
    "aria-valuetext announces the selected pair.",
  lines: {
    "picker-slider": "The digits continue for a while.",
  },
};
