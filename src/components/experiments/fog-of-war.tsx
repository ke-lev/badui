"use client";

import { useEffect, useRef } from "react";
import type { ComponentMeta } from "@/components/meta";
import { fogOfWarPrompt } from "./fog-of-war.prompt";
import { DITHER_SIZE, FOG_RADIUS, fogAlphaAt } from "./rules";
import styles from "./experiments.module.css";

const FOG_PIXEL_SIZE = 2;
const POSITION_STIFFNESS = 13;
const FADE_STIFFNESS = 18;
const KEYBOARD_STEP = 24;

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function drawMap(context: CanvasRenderingContext2D, width: number, height: number, ratio: number): void {
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#070907";
  context.fillRect(0, 0, width, height);

  context.lineWidth = 1;
  context.strokeStyle = "rgb(182 198 155 / 8%)";
  for (let x = 24; x < width; x += 48) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, height);
    context.stroke();
  }
  for (let y = 24; y < height; y += 48) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }

  context.save();
  context.translate(width * 0.5, height * 0.52);
  context.rotate(-0.18);
  for (let ring = 1; ring <= 7; ring += 1) {
    context.beginPath();
    context.ellipse(0, 0, 50 + ring * 34, 28 + ring * 20, 0, 0, Math.PI * 2);
    context.strokeStyle = "rgb(182 198 155 / " + (11 - ring * 0.9) + "%)";
    context.stroke();
  }
  context.restore();

  context.fillStyle = "rgb(205 224 177 / 28%)";
  for (let index = 0; index < 36; index += 1) {
    const x = (index * 83) % Math.max(width, 1);
    const y = (index * 137) % Math.max(height, 1);
    context.fillRect(x, y, 1, 1);
  }

  context.fillStyle = "rgb(184 203 158 / 40%)";
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("SECTOR 04", 18, 24);
  context.fillText("N  /  07", Math.max(18, width - 70), 24);
  context.fillText("37° 46′ N", Math.max(18, width - 82), Math.max(30, height - 20));
  context.setTransform(1, 0, 0, 1, 0, 0);
}

function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number, ratio: number): void {
  canvas.width = Math.max(1, Math.ceil(width * ratio));
  canvas.height = Math.max(1, Math.ceil(height * ratio));
}

export function FogOfWar() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const map = mapRef.current;
    const fog = fogRef.current;
    const spotlight = spotlightRef.current;
    const readout = readoutRef.current;
    if (!field || !map || !fog || !spotlight || !readout) return;
    const fieldElement = field;
    const mapCanvas = map;
    const fogCanvas = fog;
    const spotlightElement = spotlight;
    const readoutElement = readout;

    const mapContext = map.getContext("2d");
    const fogContext = fog.getContext("2d");
    if (!mapContext || !fogContext) return;
    const mapContextReady = mapContext;
    const fogContextReady = fogContext;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = media.matches;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let fogWidth = 0;
    let fogHeight = 0;
    let frame = 0;
    let last = 0;
    let pointerInside = false;
    let focused = false;
    let sized = false;
    let current: Point = { x: 0, y: 0 };
    let target: Point = { x: 0, y: 0 };
    let alpha = 0;
    let targetAlpha = 0;

    function paint(now: number): void {
      if (!fogWidth || !fogHeight) return;

      const image = fogContextReady.createImageData(fogWidth, fogHeight);
      const pixels = image.data;
      const cellWidth = width / fogWidth;
      const cellHeight = height / fogHeight;
      const phase = reducedMotion ? 0 : Math.floor(now / 420) % DITHER_SIZE;

      for (let y = 0; y < fogHeight; y += 1) {
        const sampleY = (y + 0.5) * cellHeight;
        for (let x = 0; x < fogWidth; x += 1) {
          const sampleX = (x + 0.5) * cellWidth;
          const distance = Math.hypot(sampleX - current.x, sampleY - current.y);
          const baseAlpha = fogAlphaAt(distance, x, y, phase) / 255;
          const clear = (1 - baseAlpha) * alpha;
          const index = (y * fogWidth + x) * 4;
          pixels[index] = 3;
          pixels[index + 1] = 4;
          pixels[index + 2] = 3;
          pixels[index + 3] = Math.round((1 - clear) * 255);
        }
      }
      fogContextReady.putImageData(image, 0, 0);

      fieldElement.style.setProperty("--spot-x", current.x + "px");
      fieldElement.style.setProperty("--spot-y", current.y + "px");
      fieldElement.style.setProperty("--spot-alpha", alpha.toFixed(3));
      const x = Math.round(current.x).toString().padStart(3, "0");
      const y = Math.round(current.y).toString().padStart(3, "0");
      readoutElement.value = "(" + x + ", " + y + ")";
      readoutElement.textContent = readoutElement.value;
      spotlightElement.dataset.active = alpha > 0.01 ? "true" : "false";
      fieldElement.dataset.active = alpha > 0.01 ? "true" : "false";
    }

    function settled(): boolean {
      return (
        Math.abs(current.x - target.x) < 0.1 &&
        Math.abs(current.y - target.y) < 0.1 &&
        Math.abs(alpha - targetAlpha) < 0.01
      );
    }

    function tick(now: number): void {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (reducedMotion) {
        current = { ...target };
        alpha = targetAlpha;
      } else {
        const positionBlend = 1 - Math.exp(-POSITION_STIFFNESS * dt);
        const fadeBlend = 1 - Math.exp(-FADE_STIFFNESS * dt);
        current = {
          x: current.x + (target.x - current.x) * positionBlend,
          y: current.y + (target.y - current.y) * positionBlend,
        };
        alpha += (targetAlpha - alpha) * fadeBlend;
      }

      paint(now);
      if (!settled()) frame = requestAnimationFrame(tick);
    }

    function wake(): void {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function resize(): void {
      const rect = fieldElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width <= 0 || height <= 0) return;

      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      setCanvasSize(mapCanvas, width, height, pixelRatio);
      fogWidth = Math.max(1, Math.ceil((width * pixelRatio) / FOG_PIXEL_SIZE));
      fogHeight = Math.max(1, Math.ceil((height * pixelRatio) / FOG_PIXEL_SIZE));
      setCanvasSize(fogCanvas, width / FOG_PIXEL_SIZE, height / FOG_PIXEL_SIZE, pixelRatio);
      drawMap(mapContextReady, width, height, pixelRatio);
      if (!sized) {
        target = { x: width * 0.5, y: height * 0.5 };
        current = { x: width * 0.5, y: height * 0.5 };
        sized = true;
      } else {
        target = { x: clamp(target.x, 0, width), y: clamp(target.y, 0, height) };
        current = { x: clamp(current.x, 0, width), y: clamp(current.y, 0, height) };
      }
      paint(performance.now());
    }

    function pointFromEvent(event: PointerEvent): Point {
      const rect = fieldElement.getBoundingClientRect();
      return {
        x: clamp(event.clientX - rect.left, 0, rect.width),
        y: clamp(event.clientY - rect.top, 0, rect.height),
      };
    }

    function showAt(point: Point): void {
      target = point;
      targetAlpha = 1;
      wake();
    }

    function onPointerMove(event: PointerEvent): void {
      showAt(pointFromEvent(event));
    }

    function onPointerEnter(event: PointerEvent): void {
      pointerInside = true;
      showAt(pointFromEvent(event));
    }

    function onPointerDown(event: PointerEvent): void {
      pointerInside = true;
      showAt(pointFromEvent(event));
    }

    function onPointerLeave(): void {
      pointerInside = false;
      if (focused) return;
      targetAlpha = 0;
      wake();
    }

    function onFocus(): void {
      focused = true;
      if (!pointerInside) target = { x: width * 0.5, y: height * 0.5 };
      targetAlpha = 1;
      wake();
    }

    function onBlur(): void {
      focused = false;
      if (pointerInside) return;
      targetAlpha = 0;
      wake();
    }

    function onKeyDown(event: KeyboardEvent): void {
      const direction: Point =
        event.key === "ArrowLeft" ? { x: -1, y: 0 } :
        event.key === "ArrowRight" ? { x: 1, y: 0 } :
        event.key === "ArrowUp" ? { x: 0, y: -1 } :
        event.key === "ArrowDown" ? { x: 0, y: 1 } :
        { x: 0, y: 0 };
      if (!direction.x && !direction.y) return;

      event.preventDefault();
      showAt({
        x: clamp(target.x + direction.x * KEYBOARD_STEP, 0, width),
        y: clamp(target.y + direction.y * KEYBOARD_STEP, 0, height),
      });
    }

    function onReducedMotionChange(event: MediaQueryListEvent): void {
      reducedMotion = event.matches;
      wake();
    }

    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(fieldElement);
    window.addEventListener("resize", resize);
    media.addEventListener("change", onReducedMotionChange);
    fieldElement.addEventListener("pointerenter", onPointerEnter, { passive: true });
    fieldElement.addEventListener("pointermove", onPointerMove, { passive: true });
    fieldElement.addEventListener("pointerdown", onPointerDown, { passive: true });
    fieldElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
    fieldElement.addEventListener("focus", onFocus);
    fieldElement.addEventListener("blur", onBlur);
    fieldElement.addEventListener("keydown", onKeyDown);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      media.removeEventListener("change", onReducedMotionChange);
      fieldElement.removeEventListener("pointerenter", onPointerEnter);
      fieldElement.removeEventListener("pointermove", onPointerMove);
      fieldElement.removeEventListener("pointerdown", onPointerDown);
      fieldElement.removeEventListener("pointerleave", onPointerLeave);
      fieldElement.removeEventListener("focus", onFocus);
      fieldElement.removeEventListener("blur", onBlur);
      fieldElement.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className={styles.specimen}>
      <div
        ref={fieldRef}
        className={styles.field}
        role="group"
        tabIndex={0}
        aria-label="Fog of war visibility field"
        aria-describedby="fog-of-war-instructions"
        data-sidekick="fog-of-war"
      >
        <canvas ref={mapRef} className={styles.map} aria-hidden="true" />
        <canvas ref={fogRef} className={styles.fog} aria-hidden="true" />
        <div className={styles.hud} aria-hidden="true">
          <div className={styles.hudTop}>
            <span><strong>Visibility field</strong> / active</span>
            <span>Map 04—07</span>
          </div>
          <div className={styles.hudBottom}>
            <span className={styles.formula}><var>V</var>(ρ) = max(0, 1−ρ)<sup>0.42</sup> · e<sup>−0.35ρ²</sup></span>
            <span>Dither {DITHER_SIZE}×{DITHER_SIZE}</span>
          </div>
        </div>
        <span id="fog-of-war-instructions" className={styles.fieldPrompt}>
          Move through the field
        </span>
        <span ref={spotlightRef} className={styles.spotlight} aria-hidden="true" />
      </div>
      <p className={styles.readout} aria-live="off" aria-atomic="true">
        <span>Position <output ref={readoutRef}>—</output></span>
        <span>Radius <output>{FOG_RADIUS}px</output></span>
      </p>
    </div>
  );
}

export const fogOfWarMeta: ComponentMeta = {
  name: "Fog of war",
  kind: "benign",
  category: "experiments",
  summary:
    "A pointer-driven visibility field with a 188-pixel light radius. An " +
    "exponential falloff reveals a contour map through an ordered 4×4 dither at " +
    "the edge, while the readout exposes the light position and field constants.",
  usage: "<FogOfWar />",
  prompt: fogOfWarPrompt,
  sidekick: false,
  notes:
    "The map is drawn on one canvas and the fog on a second low-resolution canvas " +
    "so the dither stays visible without redrawing the map. Pointer motion is " +
    "smoothed with exponential convergence at 13 s⁻¹; the light fades at 18 s⁻¹. " +
    "The field is focusable and arrow keys move the light in 24-pixel steps. " +
    "Reduced motion snaps the light to its target, freezes the dither phase, and " +
    "avoids a persistent animation loop.",
  lines: {
    "fog-of-war": "The map is visible wherever the radius allows.",
  },
};
