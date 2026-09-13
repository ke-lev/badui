"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { datePickerPrompt } from "./date-picker.prompt";
import { phoneNumberPrompt } from "./phone-number.prompt";
import styles from "./physical-specimens.module.css";
import { volumeControlPrompt } from "./volume-control.prompt";

const MAX_ROTATION = 4_500;

export function VolumeControl() {
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

export const volumeControlMeta: ComponentMeta = {
  name: "Volume control",
  kind: "hostile",
  category: "specimens",
  summary:
    "A rotary dial read in percent. One full turn of the dial moves it eight " +
    "percent, so reaching 100% takes twelve and a half turns; each arrow-key " +
    "press moves it one percent.",
  usage: "<VolumeControl />",
  prompt: volumeControlPrompt,
  notes:
    "Turned with pointer capture, so the pointer may leave the dial mid-turn. " +
    "Exposed as role=slider from 0 to 100 with aria-valuetext in percent.",
  lines: {
    "volume-dial": "It goes to 100. It does not go to 100 quickly.",
  },
};

const DAY = 86_400_000;
const FIRST_DATE = Date.UTC(1900, 0, 1);
const LAST_DAY = (Date.UTC(2026, 11, 31) - FIRST_DATE) / DAY;
const INITIAL_DAY = (Date.UTC(1996, 4, 12) - FIRST_DATE) / DAY;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function DatePicker() {
  const [day, setDay] = useState(INITIAL_DAY);
  const inputId = useId();
  const date = new Date(FIRST_DATE + day * DAY);
  const dateText = `${String(date.getUTCDate()).padStart(2, "0")} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

  return (
    <div className={styles.dateSpecimen}>
      <div className={styles.fieldHeading}>
        <label htmlFor={inputId}>Date of birth</label>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.25" y="4.75" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M3.5 8.5h13M6.5 2.75v4M13.5 2.75v4M6.5 11.5h2M11.5 11.5h2M6.5 14h2" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </div>
      <output className={styles.dateReading} htmlFor={inputId} aria-live="off">{dateText}</output>
      <div className={styles.dateTrack}>
        <input
          id={inputId}
          className={styles.dateRange}
          type="range"
          data-sidekick="date-slider"
          min={0}
          max={LAST_DAY}
          step={1}
          value={day}
          aria-valuetext={dateText}
          onChange={(event) => setDay(Number(event.target.value))}
        />
        <div className={styles.yearTicks} aria-hidden="true">
          {Array.from({ length: 27 }, (_, index) => <span key={index} className={index % 2 === 0 ? styles.yearMajorTick : ""} />)}
        </div>
        <div className={styles.rangeEndpoints} aria-hidden="true"><span>1900</span><span>2026</span></div>
      </div>
    </div>
  );
}

export const datePickerMeta: ComponentMeta = {
  name: "Date picker",
  kind: "hostile",
  category: "specimens",
  summary:
    "A date of birth set on a single range slider covering 1 January 1900 to " +
    "31 December 2026 — one hundred and twenty-seven years in one groove, one " +
    "day per step. The chosen date is read out above the track.",
  usage: "<DatePicker />",
  prompt: datePickerPrompt,
  notes:
    "A native range input, so the keyboard moves it one day at a time. " +
    "aria-valuetext carries the formatted date rather than the day number.",
  lines: {
    "date-slider": "One hundred and twenty-seven years. One groove.",
  },
};

export function PhoneNumber() {
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

export const phoneNumberMeta: ComponentMeta = {
  name: "Phone number",
  kind: "hostile",
  category: "specimens",
  summary:
    "Ten digits, each raised by its own stepper and wrapping from 9 back to 0. " +
    "Raising a digit also raises the one after it, wrapping from the tenth " +
    "back to the first.",
  usage: "<PhoneNumber />",
  prompt: phoneNumberPrompt,
  notes:
    "Each stepper is a button whose accessible name carries its position and " +
    "current value; the ten sit in a group labelled Phone number.",
  lines: {
    "phone-digit": "Every digit is on speaking terms with the next.",
  },
};
