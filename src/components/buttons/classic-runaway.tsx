"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta, SwitchState } from "@/components/meta";
import {
  bodyTransform,
  createBody,
  impact,
  isResting,
  measure,
  pointIn,
  SQUASH_DAMPING,
  SQUASH_EPSILON,
  SQUASH_STIFFNESS,
} from "./arena";
import { advance, clamp, dampingFor, gapTo, pickSpot, type Point } from "./flee";
import { Arrow, Readout } from "./parts";
import { classicRunawayPrompt } from "./runaway-button.prompt";
import styles from "./buttons.module.css";

const TRIGGER = 56; // pointer-to-edge distance that sends it, on hover
const MIN_HOP = 90;
const SAMPLES = 8;

// Flight is stiff and underdamped: ~12% past the landing spot, peak at ~125ms,
// settled by ~250ms. The cursor companion locks at 0.7; this is looser so the
// overshoot reads.
const STIFFNESS = 900;
const DAMPING = dampingFor(STIFFNESS, 0.55);

const SHIVER_RADIUS = 150;
const MAX_SHIVER = 3; // px
const MAX_TILT = 0.035; // rad

const PHRASES = [
  "haha",
  "almost",
  "psych",
  "try again",
  "peace",
  "OwO",
  "nope",
  "too slow",
  "so close",
  "bye",
];

const NO_SWITCHES: SwitchState = {};

export function ClassicRunaway({ switches = NO_SWITCHES }: { switches?: SwitchState }) {
  const onClick = switches.onClick === true;
  const anxious = switches.anxious === true;
  const talkative = switches.talkative === true;
  const [moves, setMoves] = useState(0);
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef({ onClick, anxious });
  const wakeRef = useRef<(() => void) | null>(null);
  // Set by a pointer press on the button, which moves it; the click that the
  // same press may still deliver is dropped.
  const dodgedRef = useRef(false);

  // The motion loop reads settings on later frames only, so the write can wait
  // for commit. Waking it lets Anxious start under a pointer that is not moving.
  useEffect(() => {
    settingsRef.current = { onClick, anxious };
    wakeRef.current?.();
  }, [onClick, anxious]);

  useEffect(() => {
    const arena = arenaRef.current;
    const button = buttonRef.current;
    if (!arena || !button) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = createBody();
    let { half, bounds } = measure(arena, button);
    let target: Point = { x: 0, y: 0 };
    // Kept in viewport coordinates so a scroll under a still pointer does not
    // leave it stale; converted to arena offsets whenever it is read.
    let client: { clientX: number; clientY: number } | null = null;
    let pointer: Point | null = null;
    let inFlight = false;
    let frame = 0;
    let last = 0;
    let releaseTimer = 0;

    function shiverAmount(): number {
      if (reduced || !pointer || !settingsRef.current.anxious) return 0;
      const closeness = Math.max(0, 1 - gapTo(pointer, target, half) / SHIVER_RADIUS);
      return closeness * Math.sqrt(closeness);
    }

    function tick(now: number) {
      // A wake from a frame-aligned pointer event can stamp `last` after this
      // frame's timestamp, so the first step may come out negative.
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;

      advance(body.x, target.x, dt, STIFFNESS, DAMPING);
      advance(body.y, target.y, dt, STIFFNESS, DAMPING);
      advance(body.squash, 0, dt, SQUASH_STIFFNESS, SQUASH_DAMPING, SQUASH_EPSILON);

      const ahead =
        (target.x - body.x.value) * body.travel.x + (target.y - body.y.value) * body.travel.y;
      if (inFlight && ahead <= 0) {
        inFlight = false;
        body.squash.velocity += impact(Math.hypot(body.x.velocity, body.y.velocity));
        // A landing within reach of a pointer that has not moved sends it again.
        check();
      }

      const shiver = shiverAmount();
      const jitter =
        shiver > 0
          ? {
              x: (Math.random() * 2 - 1) * MAX_SHIVER * shiver,
              y: (Math.random() * 2 - 1) * MAX_SHIVER * shiver,
              tilt: (Math.random() * 2 - 1) * MAX_TILT * shiver,
            }
          : undefined;
      button!.style.transform = bodyTransform(body, reduced, jitter);

      // The frame that finds no shiver paints clean before the loop sleeps. A
      // body still short of its target is not resting, even at zero velocity.
      const arrived = body.x.value === target.x && body.y.value === target.y;
      frame = shiver > 0 || !arrived || !isResting(body) ? requestAnimationFrame(tick) : 0;
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function hop(from: Point) {
      ({ half, bounds } = measure(arena!, button!));
      const next = pickSpot(bounds, from, target, {
        minHop: MIN_HOP,
        samples: SAMPLES,
        random: Math.random,
      });
      setMoves((count) => count + 1);

      if (reduced) {
        target = next;
        body.x.value = next.x;
        body.y.value = next.y;
        button!.style.transform = bodyTransform(body, true);
        return;
      }

      const dx = next.x - body.x.value;
      const dy = next.y - body.y.value;
      const distance = Math.hypot(dx, dy);
      target = next;
      if (distance > 0) {
        body.travel = { x: dx / distance, y: dy / distance };
        inFlight = true;
      }
      wake();
    }

    // Measured against where the button is going, not where it is mid-flight,
    // so a pointer trailing behind it does not keep re-sending it.
    function check() {
      if (!client) return;
      pointer = pointIn(arena!, client);
      const gap = gapTo(pointer, target, half);
      if (!settingsRef.current.onClick && gap < TRIGGER) hop(pointer);
      else if (settingsRef.current.anxious && gap < SHIVER_RADIUS) wake();
    }

    // Heard on the whole window: the trigger reaches 56px past the button, and
    // the button sits only 12px from its arena's walls.
    function onPointer(event: PointerEvent) {
      client = { clientX: event.clientX, clientY: event.clientY };
      check();
    }

    function onLeave() {
      client = null;
      pointer = null;
    }

    function onButtonDown(event: PointerEvent) {
      dodgedRef.current = true;
      hop(pointIn(arena!, event));
    }

    function onRelease() {
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        dodgedRef.current = false;
      }, 0);
    }

    // Watches the button too: a talkative label changes its width.
    const observer = new ResizeObserver(() => {
      ({ half, bounds } = measure(arena, button));
      const clamped = {
        x: clamp(target.x, bounds.minX, bounds.maxX),
        y: clamp(target.y, bounds.minY, bounds.maxY),
      };
      if (clamped.x === target.x && clamped.y === target.y) return;
      target = clamped;
      body.x.value = clamped.x;
      body.y.value = clamped.y;
      body.x.velocity = 0;
      body.y.velocity = 0;
      button.style.transform = bodyTransform(body, reduced);
      check();
    });
    observer.observe(arena);
    observer.observe(button);

    wakeRef.current = wake;
    button.addEventListener("pointerdown", onButtonDown);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer);
    document.documentElement.addEventListener("pointerleave", onLeave);
    arena.addEventListener("pointerup", onRelease);
    arena.addEventListener("pointercancel", onRelease);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(releaseTimer);
      observer.disconnect();
      wakeRef.current = null;
      button.removeEventListener("pointerdown", onButtonDown);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      arena.removeEventListener("pointerup", onRelease);
      arena.removeEventListener("pointercancel", onRelease);
    };
  }, []);

  const label = talkative && moves > 0 ? PHRASES[(moves - 1) % PHRASES.length] : "Continue";

  return (
    <div className={styles.specimen}>
      <div className={styles.arena} ref={arenaRef}>
        <button
          type="button"
          className={styles.button}
          ref={buttonRef}
          data-sidekick="runaway-button"
          onClick={() => {
            if (dodgedRef.current) {
              dodgedRef.current = false;
              return;
            }
            setPresses((count) => count + 1);
          }}
        >
          {label}
          {label === "Continue" && <Arrow />}
        </button>
      </div>
      <Readout presses={presses} />
    </div>
  );
}

export const classicRunawayMeta: ComponentMeta = {
  name: "Classic runaway",
  kind: "hostile",
  category: "buttons",
  summary:
    "A Continue button that springs to the spot in its area farthest from the " +
    "pointer. It stretches along its path in flight, overshoots its landing by " +
    "about a tenth of the distance, and squashes on arrival. Three switches " +
    "beneath its card set what sends it, whether it shivers, and whether it talks.",
  usage: "<ClassicRunaway switches={{ onClick: false, anxious: true, talkative: true }} />",
  prompt: classicRunawayPrompt,
  notes:
    "On hover, it moves when the pointer comes within 56 pixels; on click, only " +
    "when a press lands on it. In both, a pointer press on the button moves it " +
    "and does not count. Anxious, it shivers by up to 3 pixels while the pointer " +
    "is within 150 pixels. Talkative, its label changes on every move, cycling " +
    "through ten phrases. Each setting is off when absent from the switches " +
    "prop, and changing one keeps the button where it is. Presses are counted " +
    "in a polite live region. Under prefers-reduced-motion it relocates without " +
    "stretch, overshoot, squash, or shiver.",
  lines: {
    "runaway-button": "It has somewhere else to be.",
    "runaway-trigger-switch": "The departure can wait for contact.",
    "runaway-anxious-switch": "It keeps an eye on the distance.",
    "runaway-talkative-switch": "The label changes. The arrangement does not.",
  },
  switches: [
    { key: "onClick", off: "On hover", on: "On click", sidekick: "runaway-trigger-switch" },
    { key: "anxious", off: "Calm", on: "Anxious", sidekick: "runaway-anxious-switch" },
    { key: "talkative", off: "Mute", on: "Talkative", sidekick: "runaway-talkative-switch" },
  ],
};
