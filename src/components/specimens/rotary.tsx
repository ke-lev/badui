"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { rotaryPrompt } from "./rotary.prompt";
import {
  angleDifference,
  CARD_RADIUS,
  angleOf,
  formatNumber,
  HOLE_DIGITS,
  HOLE_RADIUS,
  HOLE_RING,
  holeAt,
  NUMBER_LENGTH,
  PLATE_RADIUS,
  pointAt,
  pull,
  PULL_SPEED,
  reachedStop,
  restAngle,
  returning,
  STOP_ANGLE,
  travelFor,
} from "./rules";
import styles from "./physical-specimens.module.css";
import { prefersReducedMotion } from "@/components/reduced-motion";

type Phase = "idle" | "dragging" | "pulling" | "returning";

const SLOT_GROUPS = [[0, 3], [3, 6], [6, 10]];
const STOP_START = pointAt(STOP_ANGLE + 11, 90);
const STOP_END = pointAt(STOP_ANGLE + 11, 108);

export function Rotary() {
  const maskId = `rotary-plate-${useId().replace(/[^\w-]/g, "")}`;
  const readoutId = useId();
  const [digits, setDigits] = useState<number[]>([]);
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [announcement, setAnnouncement] = useState("");

  const digitsRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle");
  const rotationRef = useRef(0);
  const grabbed = useRef<number | null>(null);
  const previousAngle = useRef(0);
  const frame = useRef(0);

  const full = digits.length === NUMBER_LENGTH;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function enter(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function turn(next: number) {
    rotationRef.current = next;
    setRotation(next);
  }

  function register(digit: number) {
    if (digitsRef.current.length >= NUMBER_LENGTH) return;
    const next = [...digitsRef.current, digit];
    digitsRef.current = next;
    setDigits(next);
    setAnnouncement(
      next.length === NUMBER_LENGTH ? `Dialed ${formatNumber(next)}.` : `${digit}.`,
    );
  }

  function windHome(digit: number | null) {
    const from = rotationRef.current;
    const finish = () => {
      turn(0);
      enter("idle");
      if (digit !== null) register(digit);
    };
    if (from <= 0 || prefersReducedMotion()) return finish();
    enter("returning");
    const start = performance.now();
    const step = (now: number) => {
      const next = returning(from, now - start);
      turn(next);
      if (next > 0) frame.current = requestAnimationFrame(step);
      else finish();
    };
    frame.current = requestAnimationFrame(step);
  }

  function svgPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 224,
      y: ((event.clientY - rect.top) / rect.height) * 224,
    };
  }

  function grab(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    if (phaseRef.current !== "idle" || digitsRef.current.length >= NUMBER_LENGTH) return;
    const { x, y } = svgPoint(event);
    const digit = holeAt(x, y);
    if (digit === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    grabbed.current = digit;
    previousAngle.current = angleOf(x - 112, y - 112);
    enter("dragging");
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (phaseRef.current !== "dragging" || grabbed.current === null) return;
    const { x, y } = svgPoint(event);
    const next = angleOf(x - 112, y - 112);
    const difference = angleDifference(previousAngle.current, next);
    previousAngle.current = next;
    turn(pull(rotationRef.current, difference, travelFor(grabbed.current)));
  }

  function release() {
    if (phaseRef.current !== "dragging" || grabbed.current === null) return;
    const digit = grabbed.current;
    grabbed.current = null;
    windHome(reachedStop(rotationRef.current, travelFor(digit)) ? digit : null);
  }

  function dialKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!/^[0-9]$/.test(event.key)) return;
    event.preventDefault();
    if (phaseRef.current !== "idle" || digitsRef.current.length >= NUMBER_LENGTH) return;
    const digit = Number(event.key);
    const travel = travelFor(digit);
    if (prefersReducedMotion()) {
      turn(travel);
      return windHome(digit);
    }
    enter("pulling");
    const start = performance.now();
    const step = (now: number) => {
      const next = Math.min(travel, (PULL_SPEED * (now - start)) / 1000);
      turn(next);
      if (next < travel) frame.current = requestAnimationFrame(step);
      else windHome(digit);
    };
    frame.current = requestAnimationFrame(step);
  }

  return (
    <div className={styles.rotarySpecimen}>
      <div className={styles.numberHeading}>
        <span>Phone number</span>
        <span className={styles.countryCode}>+1</span>
      </div>
      <div className={styles.number} aria-hidden="true">
        {SLOT_GROUPS.map(([start, end]) => (
          <span className={styles.numberGroup} key={start}>
            {Array.from({ length: end - start }, (_, offset) => (
              <span className={styles.slot} key={start + offset}>
                {digits[start + offset] ?? ""}
              </span>
            ))}
          </span>
        ))}
      </div>
      <span id={readoutId} className="sr-only">
        {digits.length ? `Dialed so far: ${formatNumber(digits)}` : "Nothing dialed"}
      </span>
      <div
        className={`${styles.rotaryDial} ${phase === "dragging" ? styles.dragging : ""}`}
        role="group"
        aria-roledescription="rotary dial"
        aria-label="Rotary dial"
        aria-describedby={readoutId}
        aria-disabled={full || undefined}
        aria-busy={phase !== "idle" || undefined}
        data-sidekick="rotary-dial"
        tabIndex={0}
        onKeyDown={dialKey}
        onPointerDown={grab}
        onPointerMove={drag}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <svg viewBox="0 0 224 224" aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <circle cx="112" cy="112" r={PLATE_RADIUS} fill="white" />
              <circle cx="112" cy="112" r={CARD_RADIUS} fill="black" />
              {HOLE_DIGITS.map((digit) => {
                const { x, y } = pointAt(restAngle(digit), HOLE_RING);
                return <circle key={digit} cx={x.toFixed(3)} cy={y.toFixed(3)} r={HOLE_RADIUS} fill="black" />;
              })}
            </mask>
          </defs>
          <circle className={styles.dialBase} cx="112" cy="112" r="111" />
          {HOLE_DIGITS.map((digit) => {
            const { x, y } = pointAt(restAngle(digit), HOLE_RING);
            return (
              <text key={digit} className={styles.dialDigit} x={x.toFixed(3)} y={y.toFixed(3)}>
                {digit}
              </text>
            );
          })}
          <g transform={`rotate(${rotation.toFixed(2)} 112 112)`}>
            <circle className={styles.plate} cx="112" cy="112" r={PLATE_RADIUS} mask={`url(#${maskId})`} />
            <circle className={styles.plateEdge} cx="112" cy="112" r={PLATE_RADIUS} />
            {HOLE_DIGITS.map((digit) => {
              const { x, y } = pointAt(restAngle(digit), HOLE_RING);
              return <circle key={digit} className={styles.hole} cx={x.toFixed(3)} cy={y.toFixed(3)} r={HOLE_RADIUS} />;
            })}
          </g>
          <circle className={styles.dialCard} cx="112" cy="112" r={CARD_RADIUS} />
          <line
            className={styles.fingerStop}
            x1={STOP_START.x.toFixed(3)}
            y1={STOP_START.y.toFixed(3)}
            x2={STOP_END.x.toFixed(3)}
            y2={STOP_END.y.toFixed(3)}
          />
        </svg>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}

export const rotaryMeta: ComponentMeta = {
  name: "Rotary",
  kind: "hostile",
  category: "inputs",
  summary:
    "A rotary dial for a ten-digit phone number. Each digit is pulled clockwise " +
    "from its finger hole to the stop and released, and registers once the dial " +
    "has wound home at 300 degrees a second, so a 0 takes 1.1 seconds. Digits " +
    "cannot be removed.",
  usage: "<Rotary />",
  prompt: rotaryPrompt,
  notes:
    "Pulled with pointer capture from inside a finger hole; a release more than " +
    "five degrees short of the stop registers nothing. The dial takes no input " +
    "while moving or once ten digits are in. With the dial focused, keys 0–9 " +
    "pull it round automatically. Under reduced motion the dial returns " +
    "instantly. Exposed as a focusable group described by the digits so far; " +
    "each registered digit is announced in a polite live region.",
  lines: {
    "rotary-dial": "Zero is the long way round.",
  },
};
