"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { momentumPrompt } from "./momentum.prompt";
import { brightnessAt, BTC_LAST_DAY, clamp, formatDay, priceAt, slopeAt } from "./rules";
import styles from "./sliders.module.css";

const VIEW_WIDTH = 294;
const VIEW_HEIGHT = 220;
const GRAPH = { left: 8, right: 286, top: 16, bottom: 212 };
const MID_X = (GRAPH.left + GRAPH.right) / 2;
const MID_Y = (GRAPH.top + GRAPH.bottom) / 2;
const PRICE_MIN = 50_000;
const PRICE_MAX = 130_000;
const INITIAL_DAY = 180;
const TANGENT_HALF_LENGTH = 30;

const X_SCALE = (GRAPH.right - GRAPH.left) / BTC_LAST_DAY;
const Y_SCALE = (GRAPH.bottom - GRAPH.top) / (PRICE_MAX - PRICE_MIN);

function pointFor(x: number) {
  return { x: GRAPH.left + x * X_SCALE, y: GRAPH.bottom - (priceAt(x) - PRICE_MIN) * Y_SCALE };
}

function curvePath() {
  return Array.from({ length: BTC_LAST_DAY * 4 + 1 }, (_, index) => {
    const point = pointFor(index / 4);
    return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(" ");
}

const CURVE = curvePath();

function tangentFor(x: number) {
  const point = pointFor(x);
  const dx = X_SCALE;
  const dy = -slopeAt(x) * Y_SCALE;
  const length = Math.hypot(dx, dy);
  const ux = (dx / length) * TANGENT_HALF_LENGTH;
  const uy = (dy / length) * TANGENT_HALF_LENGTH;
  return { x1: point.x - ux, y1: point.y - uy, x2: point.x + ux, y2: point.y + uy };
}

export function Momentum() {
  const [x, setX] = useState(INITIAL_DAY);
  const brightness = brightnessAt(x);
  const day = formatDay(x);
  const point = pointFor(x);
  const tangent = tangentFor(x);

  function setPosition(next: number) {
    setX(Math.round(clamp(next, 0, BTC_LAST_DAY) * 100) / 100);
  }

  function positionFromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - box.left) / box.width) * VIEW_WIDTH;
    return (viewX - GRAPH.left) / X_SCALE;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 30 : 1;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setPosition(x + step);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setPosition(x - step);
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(BTC_LAST_DAY);
    }
  }

  return (
    <div className={styles.specimen}>
      <div
        className={styles.brightnessGraph}
        data-sidekick="brightness-slider"
        role="slider"
        tabIndex={0}
        aria-label="Brightness"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={brightness}
        aria-valuetext={`slope on ${day}, brightness ${brightness}`}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          setPosition(positionFromPointer(event));
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) setPosition(positionFromPointer(event));
        }}
      >
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} aria-hidden="true" focusable="false">
          <line className={styles.graphGrid} x1={GRAPH.left} y1={MID_Y} x2={GRAPH.right} y2={MID_Y} />
          <line className={styles.graphGrid} x1={MID_X} y1={GRAPH.top} x2={MID_X} y2={GRAPH.bottom} />
          <line className={styles.graphAxis} x1={GRAPH.left} y1={GRAPH.bottom} x2={GRAPH.right + 7} y2={GRAPH.bottom} />
          <line className={styles.graphAxis} x1={GRAPH.left} y1={GRAPH.bottom} x2={GRAPH.left} y2={GRAPH.top - 4} />
          <text className={styles.graphValue} x={GRAPH.right} y={GRAPH.top + 26}>{brightness}</text>
          <path className={styles.graphCurve} d={CURVE} />
          <line className={styles.graphGuide} x1={point.x} y1={point.y} x2={point.x} y2={GRAPH.bottom} />
          <line className={styles.graphGuide} x1={GRAPH.left} y1={point.y} x2={point.x} y2={point.y} />
          <line className={styles.graphTangent} {...tangent} />
          <circle className={styles.graphPoint} cx={point.x} cy={point.y} r="5.5" />
          <text className={styles.graphLabel} x={GRAPH.right + 4} y={GRAPH.bottom - 6}>x</text>
          <text className={styles.graphLabel} x={GRAPH.left - 4} y={GRAPH.top - 6}>y</text>
        </svg>
      </div>
    </div>
  );
}

export const momentumMeta: ComponentMeta = {
  name: "Momentum",
  kind: "hostile",
  category: "sliders",
  summary:
    "A brightness control drawn as the daily closing price of BTC/USD from " +
    "15 September 2025 to 14 September 2026, joined by a cubic Hermite curve. " +
    "Dragging the point along the curve swings a tangent line; brightness is " +
    "50 plus ten times the tangent's slope in percent of price per day, " +
    "clamped to 0–100.",
  usage: "<Momentum />",
  prompt: momentumPrompt,
  notes:
    "A role=slider with pointer capture. Prices are Kraken XBT/USD daily " +
    "closes in whole dollars. The pointer sets x to the nearest hundredth of a " +
    "day. Arrow keys move one day, Shift + Arrow moves thirty, and Home and " +
    "End select the first and last days.",
  lines: {
    "brightness-slider": "Past performance is not indicative of future brightness.",
  },
};
