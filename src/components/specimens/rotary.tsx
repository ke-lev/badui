"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta, SwitchState } from "@/components/meta";
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
  nearestDialDigit,
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
const NO_SWITCHES: SwitchState = {};

export function Rotary({ switches = NO_SWITCHES }: { switches?: SwitchState }) {
  const realistic = switches.realistic === true;
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
  const activePointer = useRef<number | null>(null);
  const grabbedRealistic = useRef(false);
  const previousAngle = useRef(0);
  const gestureTravel = useRef(0);
  const frame = useRef(0);

  const full = digits.length === NUMBER_LENGTH;
  const concealed = realistic && !full;

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

  function svgPoint(
    event: PointerEvent<HTMLDivElement>,
    sample: { clientX: number; clientY: number } = event,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((sample.clientX - rect.left) / rect.width) * 224,
      y: ((sample.clientY - rect.top) / rect.height) * 224,
    };
  }

  function grab(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    if (phaseRef.current !== "idle" || digitsRef.current.length >= NUMBER_LENGTH) return;
    const { x, y } = svgPoint(event);
    const digit = holeAt(x, y);
    if (digit === null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    grabbed.current = digit;
    activePointer.current = event.pointerId;
    grabbedRealistic.current = realistic;
    previousAngle.current = angleOf(x - 112, y - 112);
    gestureTravel.current = 0;
    enter("dragging");
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (phaseRef.current !== "dragging" || grabbed.current === null ||
        event.pointerId !== activePointer.current) return;
    const track = (sample: { clientX: number; clientY: number }) => {
      const { x, y } = svgPoint(event, sample);
      const next = angleOf(x - 112, y - 112);
      gestureTravel.current += angleDifference(previousAngle.current, next);
      previousAngle.current = next;
    };
    // Keep intermediate samples so fast turns remain continuous across 0°.
    for (const sample of event.nativeEvent.getCoalescedEvents?.() ?? []) track(sample);
    track(event);
    // Clamp the plate, rather than the gesture, so passing the stop then
    // backing up does not unwind it while the pointer is still past the stop.
    turn(pull(0, gestureTravel.current, travelFor(grabbed.current)));
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (phaseRef.current !== "dragging" || grabbed.current === null ||
        event.pointerId !== activePointer.current) return;
    // Pointerup can carry a newer position than the final pointermove.
    drag(event);
    const digit = grabbed.current;
    grabbed.current = null;
    activePointer.current = null;
    const registered = grabbedRealistic.current
      ? nearestDialDigit(rotationRef.current)
      : reachedStop(rotationRef.current, travelFor(digit)) ? digit : null;
    windHome(registered);
  }

  function cancel(event: PointerEvent<HTMLDivElement>) {
    if (phaseRef.current !== "dragging" || grabbed.current === null ||
        event.pointerId !== activePointer.current) return;
    grabbed.current = null;
    activePointer.current = null;
    windHome(null);
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
                {digits[start + offset] === undefined ? "" : concealed ? "•" : digits[start + offset]}
              </span>
            ))}
          </span>
        ))}
      </div>
      <span id={readoutId} className="sr-only">
        {!digits.length ? "Nothing dialed" : concealed
          ? `${digits.length} of ${NUMBER_LENGTH} digits dialed`
          : `Dialed so far: ${formatNumber(digits)}`}
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
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
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
        {concealed ? (digits.length ? `${digits.length} of ${NUMBER_LENGTH} digits dialed.` : "") : announcement}
      </p>
    </div>
  );
}

export const rotaryMeta: ComponentMeta = {
  name: "Rotary",
  kind: "hostile",
  category: "inputs",
  summary:
    "A rotary dial for a ten-digit phone number. Standard requires each pull " +
    "to reach the stop. Realistic accepts partial turns and conceals the " +
    "number until all ten digits are entered. Digits cannot be removed.",
  usage: "<Rotary switches={{ realistic: true }} />",
  prompt: rotaryPrompt,
  notes:
    "Pulled with pointer capture from inside a finger hole. Standard is the " +
    "default; a release more than five degrees short of the stop registers " +
    "nothing. Realistic selects the digit whose full travel is nearest the " +
    "released rotation, with ties choosing the shorter travel; no rotation " +
    "registers nothing. A canceled gesture registers nothing in either mode. " +
    "Only the pointer that starts a pull controls it; its final release position " +
    "counts, and backing through an overshoot keeps the plate at the stop. " +
    "The release uses the mode selected when the pull began. The dial takes no input " +
    "while moving or once ten digits are in. With the dial focused, keys 0–9 " +
    "pull it round automatically. Under reduced motion the dial returns " +
    "instantly. Changing modes keeps the entered digits. Realistic masks " +
    "entered slots and reports only the count until the tenth digit; then " +
    "the complete number is shown and announced. Standard shows and " +
    "announces each digit. Exposed as a focusable group with a polite live region.",
  lines: {
    "rotary-dial": "Zero is the long way round.",
    "rotary-realistic-switch": "The number appears at the end.",
  },
  switches: [
    { key: "realistic", off: "Standard", on: "Realistic", sidekick: "rotary-realistic-switch" },
  ],
};
