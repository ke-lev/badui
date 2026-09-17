"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { oneGroovePrompt } from "./one-groove.prompt";
import styles from "./sliders.module.css";

const DAY = 86_400_000;
const FIRST_DATE = Date.UTC(1900, 0, 1);
const LAST_DAY = (Date.UTC(2026, 11, 31) - FIRST_DATE) / DAY;
const INITIAL_DAY = (Date.UTC(1996, 4, 12) - FIRST_DATE) / DAY;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function OneGroove() {
  const [day, setDay] = useState(INITIAL_DAY);
  const inputId = useId();
  const date = new Date(FIRST_DATE + day * DAY);
  const dateText = `${String(date.getUTCDate()).padStart(2, "0")} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Date of birth</label>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.25" y="4.75" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M3.5 8.5h13M6.5 2.75v4M13.5 2.75v4M6.5 11.5h2M11.5 11.5h2M6.5 14h2" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </div>
      <output className={styles.reading} htmlFor={inputId} aria-live="off">{dateText}</output>
      <div className={styles.track}>
        <input
          id={inputId}
          className={styles.range}
          type="range"
          data-sidekick="date-slider"
          min={0}
          max={LAST_DAY}
          step={1}
          value={day}
          aria-valuetext={dateText}
          onChange={(event) => setDay(Number(event.target.value))}
        />
        <div className={styles.ticks} aria-hidden="true">
          {Array.from({ length: 27 }, (_, index) => <span key={index} className={index % 2 === 0 ? styles.majorTick : ""} />)}
        </div>
        <div className={styles.endpoints} aria-hidden="true"><span>1900</span><span>2026</span></div>
      </div>
    </div>
  );
}

export const oneGrooveMeta: ComponentMeta = {
  name: "One groove",
  kind: "hostile",
  category: "sliders",
  summary:
    "A date of birth set on a single range slider covering 1 January 1900 to " +
    "31 December 2026 — one hundred and twenty-seven years in one groove, one " +
    "day per step. The chosen date is read out above the track.",
  usage: "<OneGroove />",
  prompt: oneGroovePrompt,
  notes:
    "A native range input, so the keyboard moves it one day at a time. " +
    "aria-valuetext carries the formatted date rather than the day number.",
  lines: {
    "date-slider": "One hundred and twenty-seven years. One groove.",
  },
};
