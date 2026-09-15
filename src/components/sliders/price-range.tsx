"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { priceRangePrompt } from "./price-range.prompt";
import { lowerPrice, PRICE_MAX, PRICE_STEP, upperPrice } from "./rules";
import styles from "./sliders.module.css";

export function PriceRange() {
  const [low, setLow] = useState(80);
  const [high, setHigh] = useState(320);
  const labelId = useId();
  const lowId = useId();
  const highId = useId();
  // Where the thumbs meet, the one that can still move away must be on top.
  const lowOnTop = low > PRICE_MAX / 2;

  return (
    <div className={styles.specimen} role="group" aria-labelledby={labelId}>
      <div className={styles.heading}>
        <span id={labelId}>Price</span>
        <span className={styles.aside}>USD</span>
      </div>
      <p className={styles.reading}>
        <output htmlFor={lowId} aria-live="off">${low}</output>
        <span className={styles.dash} aria-hidden="true"> – </span>
        <output htmlFor={highId} aria-live="off">${high}</output>
      </p>
      <div className={styles.track}>
        <div className={styles.dual}>
          <span className={styles.rail} aria-hidden="true" />
          <span className={styles.lane} aria-hidden="true">
            <span
              className={styles.fill}
              style={{ left: `${(low / PRICE_MAX) * 100}%`, right: `${100 - (high / PRICE_MAX) * 100}%` }}
            />
          </span>
          <input
            id={lowId}
            className={styles.range}
            type="range"
            data-sidekick="price-min"
            style={{ zIndex: lowOnTop ? 2 : 1 }}
            min={0}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={low}
            aria-label="Minimum price"
            aria-valuetext={`$${low}`}
            onChange={(event) => setLow(lowerPrice(Number(event.target.value), high))}
          />
          <input
            id={highId}
            className={styles.range}
            type="range"
            data-sidekick="price-max"
            style={{ zIndex: lowOnTop ? 1 : 2 }}
            min={0}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={high}
            aria-label="Maximum price"
            aria-valuetext={`$${high}`}
            onChange={(event) => setHigh(upperPrice(Number(event.target.value), low))}
          />
        </div>
        <div className={styles.endpoints} aria-hidden="true"><span>$0</span><span>$500</span></div>
      </div>
    </div>
  );
}

export const priceRangeMeta: ComponentMeta = {
  name: "Price range",
  kind: "benign",
  category: "sliders",
  summary:
    "A price filter from $0 to $500 in $10 steps, set with two thumbs on one " +
    "track. The thumbs cannot pass each other and stay at least one step " +
    "apart; the span between them is filled and read out above.",
  usage: "<PriceRange />",
  prompt: priceRangePrompt,
  notes:
    "Two native range inputs share one rail, labelled Minimum price and " +
    "Maximum price inside a group named Price, so each keeps native keyboard " +
    "behavior including Page Up, Page Down, Home, and End. Only the thumbs " +
    "take the pointer. Past $250 the minimum thumb sits above the maximum, so " +
    "both stay reachable where they meet. Focus is drawn on the thumb.",
  lines: {
    "price-min": "Nothing below this.",
    "price-max": "Nothing above this.",
  },
};
