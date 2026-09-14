"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
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
import { advance, clamp, dampingFor, gapTo, herd, startleFor, type Point } from "./flee";
import { Readout } from "./parts";
import { corneredButtonPrompt } from "./cornered-button.prompt";
import styles from "./buttons.module.css";

const RADIUS = 90; // the push begins this far from the button's edge
const MAX_SPEED = 1800; // px/s with the pointer at its edge

// The push is scaled by an alarm that pointer speed raises. Below CALM_SPEED
// a pointer raises none; by STARTLE_SPEED it raises all of it. The alarm then
// fades on its own, so a pointer that stops short is not forgotten at once.
const CALM_SPEED = 30; // px/s
const STARTLE_SPEED = 180; // px/s
const SPEED_SMOOTHING = 0.08; // s, time constant of the speed average
const MIN_ELAPSED = 0.004; // s, floor between pointer samples
const ALARM_FADE = 0.6; // s, time constant of the alarm's decay
const MIN_PRESSURE = 0.001; // below this the push is nothing

// The body trails the pushed target on a spring, so a hard stop at a wall
// carries a little past it and squashes there.
const STIFFNESS = 1000;
const DAMPING = dampingFor(STIFFNESS, 0.6);
const PRESS_SQUASH = 5;
// Held in a corner, the push compresses it into the walls instead.
const MAX_SQUISH = 0.3;

export function CorneredButton() {
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const arena = arenaRef.current;
    const button = buttonRef.current;
    if (!arena || !button) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = createBody();
    let { half, bounds } = measure(arena, button);
    let target: Point = { x: 0, y: 0 };
    let pointer: Point | null = null;
    let pointerAt = 0;
    let pointerSpeed = 0;
    let alarm = 0;
    let alarmAt = 0;
    // Whether the squash compresses toward a wall along `travel`, keeping the
    // wall-side edge in place, rather than about the centre.
    let anchored = false;
    let atWallX = false;
    let atWallY = false;
    let frame = 0;
    let last = 0;

    function alarmLevel(now: number): number {
      return alarm * Math.exp(-Math.max(now - alarmAt, 0) / 1000 / ALARM_FADE);
    }

    function raise(level: number, now: number) {
      alarm = Math.max(alarmLevel(now), level);
      alarmAt = now;
    }

    /** Moves the target; returns whether it moved and how hard it is pinned. */
    function push(dt: number, now: number): { moved: boolean; pinned: number } {
      if (!pointer) return { moved: false, pinned: 0 };
      const closeness = Math.max(0, 1 - gapTo(pointer, target, half) / RADIUS);
      const pressure = closeness * closeness * alarmLevel(now);
      if (pressure < MIN_PRESSURE) return { moved: false, pinned: 0 };
      const next = herd(target, pointer, bounds, MAX_SPEED * pressure * dt);
      if (next.x !== target.x || next.y !== target.y) {
        target = next;
        return { moved: true, pinned: 0 };
      }
      const dx = target.x - pointer.x;
      const dy = target.y - pointer.y;
      const length = Math.hypot(dx, dy);
      if (length > 0) body.travel = { x: dx / length, y: dy / length };
      anchored = true;
      return { moved: false, pinned: pressure };
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const { moved, pinned } = push(dt, now);
      let offset = { x: 0, y: 0, tilt: 0 };

      if (reduced) {
        body.x.value = target.x;
        body.y.value = target.y;
      } else {
        advance(body.x, target.x, dt, STIFFNESS, DAMPING);
        advance(body.y, target.y, dt, STIFFNESS, DAMPING);
        advance(
          body.squash,
          -MAX_SQUISH * pinned,
          dt,
          SQUASH_STIFFNESS,
          SQUASH_DAMPING,
          SQUASH_EPSILON,
        );

        // A wall is felt when the body reaches it, not when the target does.
        const wallX = body.x.value >= bounds.maxX || body.x.value <= bounds.minX;
        const wallY = body.y.value >= bounds.maxY || body.y.value <= bounds.minY;
        if (wallX && !atWallX) {
          body.travel = { x: Math.sign(body.x.value) || 1, y: 0 };
          anchored = true;
          body.squash.velocity += impact(Math.abs(body.x.velocity));
        }
        if (wallY && !atWallY) {
          body.travel = { x: 0, y: Math.sign(body.y.value) || 1 };
          anchored = true;
          body.squash.velocity += impact(Math.abs(body.y.velocity));
        }
        atWallX = wallX;
        atWallY = wallY;

        // Compression shortens the button along travel; shifting it the same
        // distance toward the wall keeps its wall-side edge where it was.
        const compression = -Math.min(body.squash.value, 0);
        if (anchored && compression > 0) {
          const { x: tx, y: ty } = body.travel;
          const reach = (Math.abs(tx) * half.x + Math.abs(ty) * half.y) * compression;
          offset = { x: tx * reach, y: ty * reach, tilt: 0 };
        }
      }

      button!.style.transform = bodyTransform(body, reduced, offset);
      // Held in place under a still, calm pointer, nothing changes until it moves.
      frame = moved || pinned > 0 || !isResting(body) ? requestAnimationFrame(tick) : 0;
    }

    function wake() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      const next = pointIn(arena!, event);
      const now = event.timeStamp;
      if (pointer) {
        const elapsed = Math.max((now - pointerAt) / 1000, MIN_ELAPSED);
        const sample = Math.hypot(next.x - pointer.x, next.y - pointer.y) / elapsed;
        pointerSpeed += (sample - pointerSpeed) * (1 - Math.exp(-elapsed / SPEED_SMOOTHING));
        raise(startleFor(pointerSpeed, CALM_SPEED, STARTLE_SPEED), now);
      } else {
        pointerSpeed = 0;
        // A pointer that arrives by pressing, with no approach, arrives at full speed.
        if (event.type === "pointerdown") raise(1, now);
      }
      pointer = next;
      pointerAt = now;
      wake();
    }

    function onLeave() {
      pointer = null;
    }

    function onButtonDown() {
      if (reduced) return;
      body.travel = { x: 0, y: 1 };
      anchored = false;
      body.squash.velocity -= PRESS_SQUASH;
      wake();
    }

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
    });
    observer.observe(arena);
    observer.observe(button);

    button.addEventListener("pointerdown", onButtonDown);
    arena.addEventListener("pointermove", onPointer, { passive: true });
    arena.addEventListener("pointerdown", onPointer);
    arena.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      button.removeEventListener("pointerdown", onButtonDown);
      arena.removeEventListener("pointermove", onPointer);
      arena.removeEventListener("pointerdown", onPointer);
      arena.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.specimen}>
      <div className={styles.arena} ref={arenaRef}>
        <button
          type="button"
          className={styles.button}
          ref={buttonRef}
          data-sidekick="cornered-button"
          onClick={() => setPresses((count) => count + 1)}
        >
          Confirm
        </button>
      </div>
      <Readout presses={presses} />
    </div>
  );
}

export const corneredButtonMeta: ComponentMeta = {
  name: "Cornered animal",
  kind: "hostile",
  category: "buttons",
  summary:
    "A Confirm button pushed directly away from a moving pointer, harder the " +
    "closer and faster the pointer comes. A pointer that moves slowly enough " +
    "does not push it. Against a wall the push turns along the wall, toward the " +
    "side farther from the pointer. In a corner, with the pointer inward of it on " +
    "both axes, it stays where it is and compresses into the walls.",
  usage: "<CorneredButton />",
  prompt: corneredButtonPrompt,
  notes:
    "The push begins 90 pixels from the button's edge and rises to 1,800 pixels " +
    "per second as the pointer reaches it. It is scaled by an alarm: pointer " +
    "speed, averaged over 80 ms, raises none of it below 30 pixels per second " +
    "and all of it at 180; the alarm then decays with a 0.6-second time " +
    "constant. A press that arrives without a prior pointer position raises it " +
    "fully. Cornered, the button compresses by up to 30% along the push, its " +
    "wall-side edge held in place. The button trails the push on a spring and " +
    "squashes where it meets a wall. Presses count from any input, in a polite " +
    "live region. Under prefers-reduced-motion it follows the push directly, " +
    "with no compression.",
  lines: {
    "cornered-button": "Everything runs out of room eventually.",
  },
};
