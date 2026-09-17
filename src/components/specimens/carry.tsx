"use client";

import { useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { carryPrompt } from "./carry.prompt";
import styles from "./physical-specimens.module.css";

export function Carry() {
  const [digits, setDigits] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [lastDigit, setLastDigit] = useState<number | null>(null);
  const groupRanges = [[0, 3], [3, 6], [6, 10]];

  function increaseDigit(index: number) {
    setDigits((current) => current.map((digit, position) => (
      position === index || position === (index + 1) % 10 ? (digit + 1) % 10 : digit
    )));
    setLastDigit(index);
  }

  return (
    <div className={styles.phoneSpecimen}>
      <div className={styles.fieldHeading}>
        <span id="phone-number-label">Phone number</span>
        <span className={styles.countryCode}>+1</span>
      </div>
      <div className={styles.phoneDigits} role="group" aria-labelledby="phone-number-label">
        {groupRanges.map(([start, end], groupIndex) => (
          <div className={styles.digitGroup} key={start}>
            {digits.slice(start, end).map((digit, localIndex) => {
              const index = start + localIndex;
              const connected = lastDigit !== null && index === (lastDigit + 1) % 10;
              return (
                <button
                  key={index}
                  type="button"
                  className={`${styles.digitButton} ${connected ? styles.connectedDigit : ""}`}
                  data-sidekick="phone-digit"
                  aria-label={`Increase digit ${index + 1}, currently ${digit}`}
                  onClick={() => increaseDigit(index)}
                >
                  <svg className={styles.digitArrow} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="m3 7.5 3-3 3 3" stroke="currentColor" strokeWidth="1.25" />
                  </svg>
                  <span>{digit}</span>
                  <span className={styles.digitUnderline} aria-hidden="true" />
                </button>
              );
            })}
            {groupIndex < 2 && <span className={styles.phoneSeparator} aria-hidden="true">–</span>}
          </div>
        ))}
      </div>
      <div className={styles.phoneFooter}>
        <span className={styles.phoneHint}>Adjust digits</span>
        <svg width="25" height="16" viewBox="0 0 25 16" fill="none" aria-hidden="true">
          <path d="M9.5 11H7a4 4 0 0 1 0-8h4a4 4 0 0 1 4 4M15.5 5H18a4 4 0 0 1 0 8h-4a4 4 0 0 1-4-4M8.5 8h8" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </div>
    </div>
  );
}

export const carryMeta: ComponentMeta = {
  name: "Carry",
  kind: "hostile",
  category: "inputs",
  summary:
    "Ten digits, each raised by its own stepper and wrapping from 9 back to 0. " +
    "Raising a digit also raises the one after it, wrapping from the tenth " +
    "back to the first.",
  usage: "<Carry />",
  prompt: carryPrompt,
  notes:
    "Each stepper is a button whose accessible name carries its position and " +
    "current value; the ten sit in a group labelled Phone number.",
  lines: {
    "phone-digit": "Every digit is on speaking terms with the next.",
  },
};
