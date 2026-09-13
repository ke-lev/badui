"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { quantityStepperPrompt } from "./quantity-stepper.prompt";
import { QUANTITY_MAX, QUANTITY_MIN, stepQuantity } from "./rules";
import styles from "./inputs.module.css";

const INITIAL_QUANTITY = 12;

export function QuantityStepper() {
  const labelId = useId();
  const [quantity, setQuantity] = useState(INITIAL_QUANTITY);

  function step(direction: 1 | -1) {
    setQuantity((current) => stepQuantity(current, direction));
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp") step(1);
    else if (event.key === "ArrowDown") step(-1);
    else return;
    event.preventDefault();
  }

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <span id={labelId}>Quantity</span>
        <span className={styles.aside}>±10%</span>
      </div>
      <div className={styles.quantityRow}>
        <button
          type="button"
          className={styles.stepButton}
          data-sidekick="quantity-less"
          aria-label="Decrease quantity"
          onClick={() => step(-1)}
        >
          −
        </button>
        <div
          className={styles.spinbutton}
          role="spinbutton"
          data-sidekick="quantity"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={QUANTITY_MIN}
          aria-valuemax={QUANTITY_MAX}
          aria-valuenow={quantity}
          onKeyDown={handleKey}
        >
          {quantity}
        </div>
        <button
          type="button"
          className={styles.stepButton}
          data-sidekick="quantity-more"
          aria-label="Increase quantity"
          onClick={() => step(1)}
        >
          +
        </button>
      </div>
      <p className={styles.hint}>Each step is ten percent of the current quantity.</p>
    </div>
  );
}

export const quantityStepperMeta: ComponentMeta = {
  name: "Quantity",
  kind: "hostile",
  category: "inputs",
  summary:
    "A quantity stepper starting at 12. Each press of − or + changes the " +
    "quantity by ten percent of its current value, rounded half up, between 1 " +
    "and 999. From 5 downward, and from 4 upward, a step rounds back to where " +
    "it started.",
  usage: "<QuantityStepper />",
  prompt: quantityStepperPrompt,
  notes:
    "The value is a role=spinbutton that takes ArrowUp and ArrowDown; the two " +
    "buttons carry their own accessible names. Values reached going up are not " +
    "always reachable going down.",
  lines: {
    quantity: "Ten percent, every time. Of whatever it is by then.",
    "quantity-less": "Less, proportionally.",
    "quantity-more": "More, proportionally.",
  },
};
