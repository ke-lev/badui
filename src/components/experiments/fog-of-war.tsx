"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { fogOfWarPrompt } from "./fog-of-war.prompt";
import {
  DOT_DAMPING_RATIO,
  DOT_PITCH,
  DOT_STIFFNESS,
  MEMORY_FLOOR,
  coverRadius,
  dotClarity,
  halfLifeScale,
  lightRadius,
  memoryDecay,
  memoryHalfLife,
  pipRadius,
  pushAt,
  visibilityAt,
} from "./rules";
import styles from "./experiments.module.css";

const POSITION_STIFFNESS = 14;
const FADE_STIFFNESS = 10;
// Same step as the cursor companion's springs, so the overshoot survives.
const SUBSTEP = 1 / 240;
const DOT_DAMPING = 2 * DOT_DAMPING_RATIO * Math.sqrt(DOT_STIFFNESS);
/** Offsets and velocities below these count as settled. */
const OFFSET_EPSILON = 0.05;
const VELOCITY_EPSILON = 0.5;

/** The map's drawing space. It is scaled to cover the card, centred, and cropped. */
const MAP_WIDTH = 480;
const MAP_HEIGHT = 320;

const PLACES = [
  { key: "greyfield", name: "Greyfield", x: 176, y: 96 },
  { key: "harrow-ford", name: "Harrow Ford", x: 206, y: 162 },
  { key: "tarn", name: "The Tarn", x: 350, y: 104, flip: true },
  { key: "saltmarsh", name: "Saltmarsh", x: 122, y: 226 },
  { key: "low-copse", name: "Low Copse", x: 244, y: 236 },
  { key: "old-watch", name: "Old Watch", x: 352, y: 214, flip: true },
] as const;

type PlaceKey = (typeof PLACES)[number]["key"];
type Point = { x: number; y: number };

const GRID = [
  ...Array.from({ length: 11 }, (_, index) => `M${(index + 1) * 40} 0V${MAP_HEIGHT}`),
  ...Array.from({ length: 7 }, (_, index) => `M0 ${(index + 1) * 40}H${MAP_WIDTH}`),
].join("");

/** Where a map point lands once the drawing is scaled to cover the card. */
function placeStyle(x: number, y: number) {
  const scale = `max(100cqw / ${MAP_WIDTH}, 100cqh / ${MAP_HEIGHT})`;
  return {
    left: `calc(50% + ${x - MAP_WIDTH / 2} * ${scale})`,
    top: `calc(50% + ${y - MAP_HEIGHT / 2} * ${scale})`,
  };
}

function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
}

export function FogOfWar() {
  const [selected, setSelected] = useState<PlaceKey | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const map = mapRef.current;
    const canvas = fogRef.current;
    const context = canvas?.getContext("2d");
    if (!map || !canvas || !context) return;
    const mapElement = map;
    const fogCanvas = canvas;
    const fog = context;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    let reducedMotion = motion.matches;
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let radius = 0;
    let scale = 1;
    let explored = new Float32Array(0);
    let clarity = new Float32Array(0);
    let halfLives = new Float32Array(0);
    let offsetX = new Float32Array(0);
    let offsetY = new Float32Array(0);
    let velocityX = new Float32Array(0);
    let velocityY = new Float32Array(0);
    let coverColor = "#fff";
    let pipColor = "#aaa";
    let current: Point = { x: 0, y: 0 };
    let target: Point = { x: 0, y: 0 };
    let alpha = 0;
    let targetAlpha = 0;
    let pointerInside = false;
    let frame = 0;
    let last = 0;

    function resolveColors(): void {
      coverColor = getComputedStyle(mapElement).backgroundColor;
      pipColor = getComputedStyle(fogCanvas).color;
    }

    /**
     * Advances every dot's memory and spring by `dt`. Reports whether any
     * crossed ground is still fading or any dot is still moving.
     */
    function step(dt: number): boolean {
      const substeps = Math.ceil(dt / SUBSTEP);
      const h = substeps > 0 ? dt / substeps : 0;
      let active = false;

      for (let row = 0; row < rows; row += 1) {
        const dy = (row - 0.5) * DOT_PITCH - current.y;
        for (let column = 0; column < columns; column += 1) {
          const dot = row * columns + column;
          const dx = (column - 0.5) * DOT_PITCH - current.x;
          const distance = Math.hypot(dx, dy);
          const lit = visibilityAt(distance, radius) * alpha;
          let kept = reducedMotion
            ? explored[dot]
            : explored[dot] * memoryDecay(dt, memoryHalfLife(distance, radius) * halfLives[dot]);
          if (kept < MEMORY_FLOOR) kept = 0;
          const remembered = Math.max(kept, lit);
          explored[dot] = remembered;
          clarity[dot] = dotClarity(lit, remembered);
          if (remembered > lit && !reducedMotion) active = true;

          if (reducedMotion) {
            offsetX[dot] = 0;
            offsetY[dot] = 0;
            velocityX[dot] = 0;
            velocityY[dot] = 0;
            continue;
          }

          const push = distance > 0 ? (pushAt(distance, radius) * alpha) / distance : 0;
          const targetX = dx * push;
          const targetY = dy * push;
          let x = offsetX[dot];
          let y = offsetY[dot];
          let vx = velocityX[dot];
          let vy = velocityY[dot];
          for (let index = 0; index < substeps; index += 1) {
            vx += (DOT_STIFFNESS * (targetX - x) - DOT_DAMPING * vx) * h;
            vy += (DOT_STIFFNESS * (targetY - y) - DOT_DAMPING * vy) * h;
            x += vx * h;
            y += vy * h;
          }
          if (
            Math.abs(targetX - x) < OFFSET_EPSILON &&
            Math.abs(targetY - y) < OFFSET_EPSILON &&
            Math.abs(vx) < VELOCITY_EPSILON &&
            Math.abs(vy) < VELOCITY_EPSILON
          ) {
            x = targetX;
            y = targetY;
            vx = 0;
            vy = 0;
          } else {
            active = true;
          }
          offsetX[dot] = x;
          offsetY[dot] = y;
          velocityX[dot] = vx;
          velocityY[dot] = vy;
        }
      }
      return active;
    }

    function paint(): void {
      fog.setTransform(scale, 0, 0, scale, 0, 0);
      fog.clearRect(0, 0, width, height);
      for (const pass of ["cover", "pip"] as const) {
        fog.beginPath();
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            const dot = row * columns + column;
            const r = pass === "cover" ? coverRadius(clarity[dot]) : pipRadius(clarity[dot]);
            if (r < 0.05) continue;
            const x = (column - 0.5) * DOT_PITCH + offsetX[dot];
            const y = (row - 0.5) * DOT_PITCH + offsetY[dot];
            fog.moveTo(x + r, y);
            fog.arc(x, y, r, 0, Math.PI * 2);
          }
        }
        fog.fillStyle = pass === "cover" ? coverColor : pipColor;
        fog.fill();
      }
      fogCanvas.dataset.painted = "";
    }

    function tick(now: number): void {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (reducedMotion) {
        current = { ...target };
        alpha = targetAlpha;
      } else {
        const move = 1 - Math.exp(-POSITION_STIFFNESS * dt);
        const fade = 1 - Math.exp(-FADE_STIFFNESS * dt);
        current = { x: current.x + (target.x - current.x) * move, y: current.y + (target.y - current.y) * move };
        alpha += (targetAlpha - alpha) * fade;
      }

      const active = step(dt);
      paint();
      const settled =
        Math.abs(current.x - target.x) < 0.1 &&
        Math.abs(current.y - target.y) < 0.1 &&
        Math.abs(alpha - targetAlpha) < 0.01;
      if (!settled || active) frame = requestAnimationFrame(tick);
    }

    function wake(): void {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function resize(): void {
      const rect = mapElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      width = rect.width;
      height = rect.height;
      scale = window.devicePixelRatio || 1;
      // One extra ring of dots around the edge, so pushed dots never leave the border bare.
      columns = Math.ceil(width / DOT_PITCH) + 2;
      rows = Math.ceil(height / DOT_PITCH) + 2;
      radius = lightRadius(width, height);
      fogCanvas.width = Math.round(width * scale);
      fogCanvas.height = Math.round(height * scale);
      const count = columns * rows;
      explored = new Float32Array(count);
      clarity = new Float32Array(count);
      offsetX = new Float32Array(count);
      offsetY = new Float32Array(count);
      velocityX = new Float32Array(count);
      velocityY = new Float32Array(count);
      halfLives = new Float32Array(count);
      for (let dot = 0; dot < count; dot += 1) {
        halfLives[dot] = halfLifeScale(dot % columns, Math.floor(dot / columns));
      }
      step(0);
      paint();
    }

    /** Aims the light; a light that is out appears at its target rather than travelling there. */
    function aim(point: Point): void {
      if (alpha < 0.01) current = point;
      target = point;
      targetAlpha = 1;
      wake();
    }

    function pointFromEvent(event: PointerEvent): Point {
      const rect = mapElement.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function aimAtFocus(): boolean {
      const focused = document.activeElement;
      if (!focused || !mapElement.contains(focused) || !isFocusVisible(focused)) return false;
      const rect = focused.getBoundingClientRect();
      const origin = mapElement.getBoundingClientRect();
      aim({ x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top });
      return true;
    }

    function onPointer(event: PointerEvent): void {
      pointerInside = true;
      aim(pointFromEvent(event));
    }

    function onPointerLeave(): void {
      pointerInside = false;
      if (aimAtFocus()) return;
      targetAlpha = 0;
      wake();
    }

    function onFocusIn(): void {
      if (!pointerInside) aimAtFocus();
    }

    function onFocusOut(event: FocusEvent): void {
      if (pointerInside || mapElement.contains(event.relatedTarget as Node | null)) return;
      targetAlpha = 0;
      wake();
    }

    function onMotionChange(event: MediaQueryListEvent): void {
      reducedMotion = event.matches;
      wake();
    }

    function onThemeChange(): void {
      resolveColors();
      paint();
    }

    resolveColors();
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mapElement);
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    motion.addEventListener("change", onMotionChange);
    scheme.addEventListener("change", onThemeChange);
    mapElement.addEventListener("pointerenter", onPointer);
    mapElement.addEventListener("pointermove", onPointer);
    mapElement.addEventListener("pointerdown", onPointer);
    mapElement.addEventListener("pointerleave", onPointerLeave);
    mapElement.addEventListener("pointercancel", onPointerLeave);
    mapElement.addEventListener("focusin", onFocusIn);
    mapElement.addEventListener("focusout", onFocusOut);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", onMotionChange);
      scheme.removeEventListener("change", onThemeChange);
      mapElement.removeEventListener("pointerenter", onPointer);
      mapElement.removeEventListener("pointermove", onPointer);
      mapElement.removeEventListener("pointerdown", onPointer);
      mapElement.removeEventListener("pointerleave", onPointerLeave);
      mapElement.removeEventListener("pointercancel", onPointerLeave);
      mapElement.removeEventListener("focusin", onFocusIn);
      mapElement.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <div ref={mapRef} className={styles.map} role="group" aria-label="Map" data-sidekick="fog-of-war">
      <svg
        className={styles.terrain}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <rect className={styles.water} width={MAP_WIDTH} height={MAP_HEIGHT} />
        <path className={styles.land} d="M130 0C118 34 88 58 94 98C100 136 64 160 70 198C76 238 128 250 152 276C166 292 168 320 168 320L480 320L480 0Z" />
        <path className={styles.land} d="M36 250c10-12 34-10 36 3c2 13-18 20-31 15c-8-3-10-10-5-18z" />
        <path className={styles.land} d="M52 70c6-8 20-6 21 2c1 8-10 12-18 9c-5-2-6-6-3-11z" />
        <path className={styles.forest} d="M206 214c18-24 60-22 76-4c16 18 6 48-20 54c-30 6-66-4-64-26c1-10 4-16 8-24z" />
        <path className={styles.forest} d="M252 30c24-12 58 0 60 22c2 22-24 32-48 28c-22-4-30-36-12-50z" />
        <path className={styles.forest} d="M404 250c14-10 36-4 38 12c2 14-16 22-30 18c-14-4-20-20-8-30z" />
        <g className={styles.contour}>
          <ellipse cx="352" cy="214" rx="54" ry="32" />
          <ellipse cx="352" cy="214" rx="36" ry="21" />
          <ellipse cx="352" cy="214" rx="18" ry="10" />
        </g>
        <ellipse className={styles.water} cx="350" cy="104" rx="44" ry="22" transform="rotate(-12 350 104)" />
        <path className={styles.river} d="M308 114C284 138 262 126 238 150S196 166 168 152S120 138 94 132" />
        <path className={styles.road} d="M152 276C196 258 222 252 254 238S330 196 356 158S418 118 470 50" />
        <path className={styles.ridge} d="M366 176l9-13l9 13M384 184l8-11l8 11" />
        <path className={styles.grid} d={GRID} />
      </svg>
      {PLACES.map((place) => (
        <button
          key={place.key}
          type="button"
          className={styles.place}
          style={placeStyle(place.x, place.y)}
          aria-pressed={selected === place.key}
          data-flip={"flip" in place ? "" : undefined}
          data-sidekick="fog-place"
          onClick={() => setSelected((current) => (current === place.key ? null : place.key))}
        >
          <span className={styles.marker} aria-hidden="true" />
          <span className={styles.name}>{place.name}</span>
        </button>
      ))}
      <canvas ref={fogRef} className={styles.fog} aria-hidden="true" />
    </div>
  );
}

export const fogOfWarMeta: ComponentMeta = {
  name: "Fog of war",
  kind: "hostile",
  category: "experiments",
  summary:
    "A survey map filling the card, with six named places to select, covered " +
    "by a field of overlapping dots. Around the pointer the dots shrink away " +
    "and are pushed aside on springs. Ground already crossed keeps smaller " +
    "dots, which grow back from the outside in: a six-second half-life at the " +
    "light's edge, 0.6 seconds three and a half radii away.",
  usage: "<FogOfWar />",
  prompt: fogOfWarPrompt,
  sidekick: false,
  notes:
    "The map is an SVG drawing 480 by 320 units, scaled to cover the card " +
    "and cropped at the centre; the places are positioned with container " +
    "query units so they stay on their landmarks at any size. The dots sit on " +
    "a 6-pixel lattice with a 4.4-pixel radius, each carrying a 0.9-pixel " +
    "pip; colours are re-read when the theme changes. The light's radius is " +
    "30% of the card's shorter side, and never under 64 pixels; its inner 55% " +
    "is fully clear. Dots are pushed up to 10 pixels outward, hardest at the " +
    "light's edge, on a spring with stiffness 170 and damping ratio 0.55. " +
    "Crossed ground keeps up to 60% clarity, and each dot's half-life is " +
    "scaled by a fixed factor between 0.7 and 1.3. After the pointer leaves, " +
    "the dots settle back and the fog closes toward the light's last " +
    "position. The animation runs only while something is moving. Focusing a " +
    "place from the keyboard moves the light to it. Places are toggle buttons " +
    "with aria-pressed, and at most one is selected. Under reduced motion the " +
    "dots do not move, the light jumps to its target, and crossed ground does " +
    "not fog over again.",
  lines: {
    "fog-of-war": "Everything is here. Some of it is visible.",
    "fog-place": "It was here the last time anyone looked.",
  },
};
