"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { brightnessPrompt } from "./brightness.prompt";
import { equationFor, formatEquation, speakEquation } from "./rules";
import styles from "./sliders.module.css";

export function Brightness() {
  const [value, setValue] = useState(60);
  const inputId = useId();
  const equation = equationFor(value);

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Brightness</label>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.41 1.41M14.42 14.42l1.41 1.41M4.17 15.83l1.41-1.41M14.42 5.58l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>
      </div>
      <output className={`${styles.reading} ${styles.equation}`} htmlFor={inputId} aria-live="off">
        {formatEquation(equation)
          .split("x")
          .flatMap((part, index) => (index === 0 ? [part] : [<var key={index} className={styles.variable}>x</var>, part]))}
      </output>
      <div className={styles.track}>
        <input
          id={inputId}
          className={styles.range}
          type="range"
          data-sidekick="brightness-slider"
          min={0}
          max={100}
          step={1}
          value={value}
          aria-valuetext={speakEquation(equation)}
          onChange={(event) => setValue(Number(event.target.value))}
        />
        <div className={styles.endpoints} aria-hidden="true"><span>0</span><span>100</span></div>
      </div>
    </div>
  );
}

export const brightnessMeta: ComponentMeta = {
  name: "Brightness",
  kind: "hostile",
  category: "sliders",
  summary:
    "A brightness slider from 0 to 100 whose readout is a linear equation " +
    "rather than a number. The current value is the equation's solution for " +
    "x, and every step of the slider writes a different equation.",
  usage: "<Brightness />",
  prompt: brightnessPrompt,
  notes:
    "A native range input with its native one-step keyboard. aria-valuenow " +
    "carries the value and aria-valuetext the equation, with its operators in " +
    "words. Equations are derived from the value alone, so a value always " +
    "reads the same way.",
  lines: {
    "brightness-slider": "The value is x.",
  },
};
