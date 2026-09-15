"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { digitWindow, TIP_LAST, tipAt } from "./rules";
import styles from "./sliders.module.css";
import { tipSliderPrompt } from "./tip-slider.prompt";

const BILL = 48;

export function TipSlider() {
  const [position, setPosition] = useState(0);
  const inputId = useId();
  const percent = tipAt(position);
  const strip = digitWindow(position);

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Tip</label>
        <span className={styles.aside}>Bill ${BILL.toFixed(2)}</span>
      </div>
      <div className={`${styles.reading} ${styles.split}`}>
        <output htmlFor={inputId} aria-live="off">{percent}%</output>
        <span className={styles.aside}>${((BILL * percent) / 100).toFixed(2)}</span>
      </div>
      <div className={styles.track}>
        <input
          id={inputId}
          className={styles.range}
          type="range"
          data-sidekick="tip-slider"
          min={0}
          max={TIP_LAST}
          step={1}
          value={position}
          aria-valuetext={`${percent} percent`}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
        <p className={styles.digits} aria-hidden="true">
          {strip.before}<mark>{strip.pair}</mark>{strip.after}
        </p>
      </div>
    </div>
  );
}

export const tipSliderMeta: ComponentMeta = {
  name: "Tip",
  kind: "hostile",
  category: "sliders",
  summary:
    "A tip percentage on a $48.00 bill, set on a range slider of 605 steps. " +
    "Each step reads the next pair of consecutive decimal digits of π, " +
    "starting at 14%; every percentage from 0 to 99 appears by the last step. " +
    "A strip beneath the track shows the digits around the current pair.",
  usage: "<TipSlider />",
  prompt: tipSliderPrompt,
  notes:
    "A native range input, so the keyboard moves one digit along. " +
    "aria-valuetext carries the percentage rather than the step. The tip " +
    "amount updates beside the reading.",
  lines: {
    "tip-slider": "Every percentage is in there. Eventually.",
  },
};
