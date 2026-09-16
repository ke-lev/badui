"use client";

import { useEffect, useRef } from "react";
import type { ComponentMeta, SwitchState } from "@/components/meta";
import { fogOfWarPrompt } from "./fog-of-war.prompt";
import {
  CORE_RATE,
  DOT_DAMPING_RATIO,
  DOT_PITCH,
  DOT_STIFFNESS,
  MEMORY_FLOOR,
  PIP_RADIUS,
  POP_DAMPING_RATIO,
  POP_STIFFNESS,
  brushRadius,
  coreOffset,
  coverRadius,
  dotClarity,
  easeMix,
  forgetDistance,
  halfLifeScale,
  lightRadius,
  mapDotRadius,
  memoryDecay,
  memoryHalfLife,
  pipRadius,
  pushAt,
  sprayCount,
  sprayOffset,
  spraySize,
  stepMix,
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
const POP_DAMPING = 2 * POP_DAMPING_RATIO * Math.sqrt(POP_STIFFNESS);
/** Scales and scale velocities below these count as settled. */
const SCALE_EPSILON = 0.005;
const SCALE_VELOCITY_EPSILON = 0.05;

const MAP_SOURCE = "/map-of-middle-earth.jpg";
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 900;
/** Trimmed from each side of the image, so its frame and corner ornaments never show. */
const CROP_X = 100;
const CROP_Y = 80;
const NO_SWITCHES: SwitchState = {};

type Point = { x: number; y: number };

export function FogOfWar({ switches = NO_SWITCHES }: { switches?: SwitchState }) {
  const spray = switches.spray === true;
  const remember = switches.remember === true;
  const mapRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  // The first render's settings, so the fog mounts already in them rather than easing there.
  const initialRef = useRef({ spray, remember });
  const setSprayRef = useRef<((on: boolean) => void) | null>(null);
  const setRememberRef = useRef<((on: boolean) => void) | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    const shade = shadeRef.current;
    const canvas = fogRef.current;
    const context = canvas?.getContext("2d");
    if (!map || !shade || !canvas || !context) return;
    const mapElement = map;
    const shadeElement = shade;
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
    // Spray: each dot's laid scale, its velocity, the size it was laid at, and
    // whether it is laid (1) or leaving (0).
    let sprayScale = new Float32Array(0);
    let sprayVelocity = new Float32Array(0);
    let sprayWeight = new Float32Array(0);
    let sprayTarget = new Uint8Array(0);
    let brush = 0;
    let sprayCarry = 0;
    /** The latest pointer position inside the map, or null while the pointer is outside. */
    let pointer: Point | null = null;
    let coverColor = "#fff";
    let pipColor = "#aaa";
    let shadeColor = "transparent";
    let current: Point = { x: 0, y: 0 };
    let target: Point = { x: 0, y: 0 };
    let alpha = 0;
    let targetAlpha = 0;
    let mix = initialRef.current.spray ? 1 : 0;
    let mixTarget = mix;
    /** Remember: crossed ground never fogs over, and laid dots never leave. */
    let keep = initialRef.current.remember;
    let coreCarry = 0;
    let frame = 0;
    let last = 0;

    const picture = new Image();
    let pictureReady = false;
    const mapLayer = document.createElement("canvas");
    const mapLayerContext = mapLayer.getContext("2d");
    let mapLayerReady = false;

    function resolveColors(): void {
      coverColor = getComputedStyle(mapElement).backgroundColor;
      pipColor = getComputedStyle(fogCanvas).color;
      shadeColor = getComputedStyle(shadeElement).backgroundColor;
    }

    /**
     * Renders the map, cropped, scaled, and shaded exactly as the SVG and
     * shade show it, into an offscreen canvas the sprayed dots are cut from.
     * Runs on resize, theme change, and image load, never per frame.
     */
    function buildMapLayer(): void {
      mapLayerReady = false;
      if (!pictureReady || !mapLayerContext || width <= 0 || height <= 0) return;
      const g = mapLayerContext;
      const cropWidth = MAP_WIDTH - 2 * CROP_X;
      const cropHeight = MAP_HEIGHT - 2 * CROP_Y;
      const fit = Math.max(width / cropWidth, height / cropHeight);
      const x = (width - cropWidth * fit) / 2 - CROP_X * fit;
      const y = (height - cropHeight * fit) / 2 - CROP_Y * fit;
      mapLayer.width = Math.round(width * scale);
      mapLayer.height = Math.round(height * scale);
      g.setTransform(scale, 0, 0, scale, 0, 0);
      g.drawImage(picture, x, y, MAP_WIDTH * fit, MAP_HEIGHT * fit);
      g.globalCompositeOperation = "multiply";
      g.fillStyle = shadeColor;
      g.fillRect(0, 0, width, height);
      g.globalCompositeOperation = "source-over";
      mapLayerReady = true;
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
          let kept = reducedMotion || keep
            ? explored[dot]
            : explored[dot] * memoryDecay(dt, memoryHalfLife(distance, radius) * halfLives[dot]);
          if (kept < MEMORY_FLOOR) kept = 0;
          const remembered = Math.max(kept, lit);
          explored[dot] = remembered;
          clarity[dot] = dotClarity(lit, remembered);
          if (remembered > lit && !reducedMotion && !keep) active = true;

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

    /**
     * Spray: sends laid dots the pointer has moved away from on their way,
     * and advances every dot's scale spring by `dt`. Reports whether any dot
     * is still landing or leaving.
     */
    function stepSpray(dt: number): boolean {
      const substeps = Math.ceil(dt / SUBSTEP);
      const h = substeps > 0 ? dt / substeps : 0;
      let active = false;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const dot = row * columns + column;
          if (sprayTarget[dot] === 1 && !keep) {
            const far =
              pointer === null ||
              Math.hypot((column - 0.5) * DOT_PITCH - pointer.x, (row - 0.5) * DOT_PITCH - pointer.y) >
                forgetDistance(brush, column, row);
            if (far) {
              sprayTarget[dot] = 0;
              // Forgotten, so a later pass may lay it small again.
              sprayWeight[dot] = 0;
            }
          }
          const goal = sprayTarget[dot] === 1 ? sprayWeight[dot] : 0;
          let scale = sprayScale[dot];
          let velocity = sprayVelocity[dot];
          if (scale === goal && velocity === 0) continue;

          if (reducedMotion) {
            scale = goal;
            velocity = 0;
          } else {
            for (let index = 0; index < substeps; index += 1) {
              velocity += (POP_STIFFNESS * (goal - scale) - POP_DAMPING * velocity) * h;
              scale += velocity * h;
            }
            if (Math.abs(goal - scale) < SCALE_EPSILON && Math.abs(velocity) < SCALE_VELOCITY_EPSILON) {
              scale = goal;
              velocity = 0;
            } else {
              active = true;
            }
          }
          sprayScale[dot] = scale;
          sprayVelocity[dot] = velocity;
        }
      }
      return active;
    }

    /**
     * Spray: lays the map dot nearest `point` moved by `offset`, if it is on
     * the lattice, at the size its distance from the pointer gives it. A dot
     * laid nearer than it already was grows to the larger size.
     */
    function spray(point: Point, offset: Point): void {
      const column = Math.round((point.x + offset.x) / DOT_PITCH + 0.5);
      const row = Math.round((point.y + offset.y) / DOT_PITCH + 0.5);
      if (column < 0 || column >= columns || row < 0 || row >= rows) return;
      const dot = row * columns + column;
      sprayTarget[dot] = 1;
      sprayWeight[dot] = Math.max(sprayWeight[dot], spraySize(Math.hypot(offset.x, offset.y), brush));
    }

    /** Adds a circle for every dot whose radius, from `radiusOf`, is visible. */
    function traceDots(radiusOf: (dot: number) => number, moving: boolean): void {
      fog.beginPath();
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const dot = row * columns + column;
          const r = radiusOf(dot);
          if (r < 0.05) continue;
          const x = (column - 0.5) * DOT_PITCH + (moving ? offsetX[dot] : 0);
          const y = (row - 0.5) * DOT_PITCH + (moving ? offsetY[dot] : 0);
          fog.moveTo(x + r, y);
          fog.arc(x, y, r, 0, Math.PI * 2);
        }
      }
    }

    /** Fog: the fog's dots cover the map and shrink away from the light. */
    function paintFog(): void {
      traceDots((dot) => coverRadius(clarity[dot]), true);
      fog.fillStyle = coverColor;
      fog.fill();
      traceDots((dot) => pipRadius(clarity[dot]), true);
      fog.fillStyle = pipColor;
      fog.fill();
    }

    /** Spray: the board stays put, and the map is sprayed onto it in dots that pop in and out. */
    function paintSpray(): void {
      fog.fillStyle = coverColor;
      fog.fillRect(0, 0, width, height);
      traceDots(() => PIP_RADIUS, false);
      fog.fillStyle = pipColor;
      fog.fill();
      if (!mapLayerReady) return;
      traceDots((dot) => mapDotRadius(sprayScale[dot]), false);
      fog.save();
      fog.clip();
      fog.drawImage(mapLayer, 0, 0, width, height);
      fog.restore();
    }

    function paint(): void {
      fog.setTransform(scale, 0, 0, scale, 0, 0);
      fog.clearRect(0, 0, width, height);
      const blend = easeMix(mix);
      if (blend < 0.999) paintFog();
      if (blend > 0.001) {
        fog.globalAlpha = blend;
        paintSpray();
        fog.globalAlpha = 1;
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
        mix = mixTarget;
      } else {
        const move = 1 - Math.exp(-POSITION_STIFFNESS * dt);
        const fade = 1 - Math.exp(-FADE_STIFFNESS * dt);
        current = { x: current.x + (target.x - current.x) * move, y: current.y + (target.y - current.y) * move };
        alpha += (targetAlpha - alpha) * fade;
        mix = stepMix(mix, mixTarget, dt);
      }

      const fading = step(dt);
      const popping = stepSpray(dt);
      paint();
      const settled =
        Math.abs(current.x - target.x) < 0.1 &&
        Math.abs(current.y - target.y) < 0.1 &&
        Math.abs(alpha - targetAlpha) < 0.01 &&
        mix === mixTarget;
      if (!settled || fading || popping) frame = requestAnimationFrame(tick);
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
      sprayScale = new Float32Array(count);
      sprayVelocity = new Float32Array(count);
      sprayWeight = new Float32Array(count);
      sprayTarget = new Uint8Array(count);
      brush = brushRadius(radius);
      sprayCarry = 0;
      coreCarry = 0;
      for (let dot = 0; dot < count; dot += 1) {
        halfLives[dot] = halfLifeScale(dot % columns, Math.floor(dot / columns));
      }
      buildMapLayer();
      step(0);
      paint();
    }

    /**
     * Aims the light at the pointer; a light that is out appears there rather
     * than travelling. In Spray, it also sprays in proportion to the distance
     * moved since the last event, so a pointer held still lays nothing.
     */
    function onPointer(event: PointerEvent): void {
      const rect = mapElement.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (alpha < 0.01) current = point;
      target = point;
      targetAlpha = 1;
      if (pointer && mixTarget === 1) {
        const moved = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        const laid = sprayCount(moved, sprayCarry);
        sprayCarry = laid.carry;
        for (let index = 0; index < laid.count; index += 1) {
          spray(point, sprayOffset(Math.random(), Math.random(), brush));
        }
        const core = sprayCount(moved, coreCarry, CORE_RATE);
        coreCarry = core.carry;
        for (let index = 0; index < core.count; index += 1) {
          spray(point, coreOffset(Math.random(), Math.random(), brush));
        }
      }
      pointer = point;
      wake();
    }

    function onPointerLeave(): void {
      pointer = null;
      targetAlpha = 0;
      wake();
    }

    function onMotionChange(event: MediaQueryListEvent): void {
      reducedMotion = event.matches;
      wake();
    }

    function onThemeChange(): void {
      resolveColors();
      buildMapLayer();
      paint();
    }

    function onPictureLoad(): void {
      pictureReady = true;
      buildMapLayer();
      paint();
    }

    setSprayRef.current = (on) => {
      mixTarget = on ? 1 : 0;
      wake();
    };

    setRememberRef.current = (on) => {
      keep = on;
      wake();
    };

    resolveColors();
    resize();
    picture.addEventListener("load", onPictureLoad);
    picture.src = MAP_SOURCE;
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

    return () => {
      if (frame) cancelAnimationFrame(frame);
      setSprayRef.current = null;
      setRememberRef.current = null;
      picture.removeEventListener("load", onPictureLoad);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", onMotionChange);
      scheme.removeEventListener("change", onThemeChange);
      mapElement.removeEventListener("pointerenter", onPointer);
      mapElement.removeEventListener("pointermove", onPointer);
      mapElement.removeEventListener("pointerdown", onPointer);
      mapElement.removeEventListener("pointerleave", onPointerLeave);
      mapElement.removeEventListener("pointercancel", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    setSprayRef.current?.(spray);
  }, [spray]);

  useEffect(() => {
    setRememberRef.current?.(remember);
  }, [remember]);

  return (
    <div ref={mapRef} className={styles.map} role="img" aria-label="Map of Middle-earth" data-sidekick="fog-of-war">
      <svg
        className={styles.terrain}
        viewBox={`${CROP_X} ${CROP_Y} ${MAP_WIDTH - 2 * CROP_X} ${MAP_HEIGHT - 2 * CROP_Y}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <image href={MAP_SOURCE} width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="none" />
      </svg>
      <div ref={shadeRef} className={styles.shade} aria-hidden="true" />
      <canvas ref={fogRef} className={styles.fog} aria-hidden="true" />
    </div>
  );
}

export const fogOfWarMeta: ComponentMeta = {
  name: "Fog of war",
  kind: "hostile",
  category: "experiments",
  summary:
    "A map of Middle-earth filling the card, covered by a field of " +
    "overlapping dots. Around the pointer the dots shrink away and are pushed " +
    "aside on springs. Ground already crossed keeps smaller dots, which grow " +
    "back from the outside in: a six-second half-life at the light's edge, " +
    "0.6 seconds three and a half radii away.",
  usage: "<FogOfWar switches={{ spray: true, remember: true }} />",
  prompt: fogOfWarPrompt,
  sidekick: false,
  notes:
    "The 1600 × 900 map image is trimmed by 100 pixels at each side and 80 " +
    "at top and bottom, then scaled to cover the card and cropped at the " +
    "centre, so its frame never shows. In a dark scheme it is shaded. The " +
    "dots sit on a 6-pixel lattice with a 4.4-pixel radius, in a parchment " +
    "colour, each carrying a 0.9-pixel pip; colours are re-read when the " +
    "theme changes. The light's radius is 30% of the card's shorter side, and " +
    "never under 64 pixels; its inner 55% is fully clear. Dots are pushed up " +
    "to 10 pixels outward, hardest at the light's edge, on a spring with " +
    "stiffness 170 and damping ratio 0.55. Crossed ground keeps up to 60% " +
    "clarity, and each dot's half-life is scaled by a fixed factor between " +
    "0.7 and 1.3. With the Spray switch on, the parchment board and its " +
    "pips hold still and the map is sprayed onto it instead: moving the " +
    "pointer lays 1.2 map dots per pixel travelled, at random lattice points " +
    "within a brush 70% of the light's radius, densest at its centre, plus " +
    "4 more per pixel spread evenly across a core 40% of the brush's radius. " +
    "A dot lands at full size within the core and smaller the further out it " +
    "falls, down to 30% of a full dot at the brush's edge; one laid nearer " +
    "than it already was grows. A pointer held still lays nothing. Each dot " +
    "springs to its size with overshoot (stiffness 260, damping ratio 0.45) " +
    "and springs back to " +
    "nothing once the pointer is more than two and a half brush radii away, " +
    "give or take 20% per dot, or leaves the map. The Spray switch eases " +
    "between the two modes over 0.3 seconds. With the Remember switch on, " +
    "crossed ground holds its clarity and never fogs over, and laid map dots " +
    "stay when the pointer moves away or leaves; turning it off lets both " +
    "resume from where they are. Both switches are off when absent from the " +
    "switches prop. After the pointer leaves, the dots settle back " +
    "and the fog closes toward the light's last position. The animation runs " +
    "only while something is moving. The map has no controls and is exposed " +
    "as role=img named “Map of Middle-earth”. Under reduced motion the dots " +
    "do not move, the light jumps to its target, the switch changes at once, " +
    "crossed ground does not fog over again, and sprayed dots appear and " +
    "disappear without springing.",
  lines: {
    "fog-of-war": "Everything is here. Some of it is visible.",
    "fog-spray-switch": "Only where you keep moving.",
    "fog-remember-switch": "Where you have been, and for how long.",
  },
  switches: [
    { key: "spray", off: "Fog", on: "Spray", sidekick: "fog-spray-switch" },
    { key: "remember", off: "Forget", on: "Remember", sidekick: "fog-remember-switch" },
  ],
};
