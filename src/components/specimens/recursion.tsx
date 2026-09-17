"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import styles from "./form-specimens.module.css";
import { recursionPrompt } from "./recursion.prompt";

const confirmations = [
  "Would you like to continue?",
  "Please confirm your confirmation.",
  "Are you sure you were sure?",
  "This will confirm the previous confirmation.",
  "One more confirmation is required.",
  "Your confirmation needs confirmation.",
];

export function Recursion() {
  const titleId = useId();
  const [depth, setDepth] = useState(1);

  if (depth === 0) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle} role="status">Action canceled.</p>
        <button className={styles.secondaryButton} type="button" data-sidekick="dialog-restart" onClick={() => setDepth(1)}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dialogStack} data-layers={Math.min(depth - 1, 2)}>
      <div className={styles.dialog} role="dialog" data-sidekick="dialog" aria-modal="false" aria-labelledby={titleId}>
        <button
          type="button"
          className={styles.closeButton}
          data-sidekick="dialog-close"
          aria-label="Close confirmation"
          onClick={() => setDepth((current) => current + 1)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <p className={styles.eyebrow} aria-live="polite">
          Confirmation {String(depth).padStart(2, "0")}
        </p>
        <p className={styles.dialogTitle} id={titleId}>Are you sure?</p>
        <p className={styles.dialogMessage} aria-live="polite">
          {confirmations[(depth - 1) % confirmations.length]}
        </p>
        <div className={styles.dialogActions}>
          <button className={styles.secondaryButton} type="button" onClick={() => setDepth((current) => current - 1)}>
            Cancel
          </button>
          <button className={styles.primaryButton} type="button" onClick={() => setDepth((current) => current + 1)}>
            Continue <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const recursionMeta: ComponentMeta = {
  name: "Recursion",
  kind: "hostile",
  category: "feedback",
  summary:
    "A confirmation dialog that counts. Continue and the close button each " +
    "raise the count by one and ask again; Cancel lowers it by one, and " +
    "cancelling the first dialog ends the sequence.",
  usage: "<Recursion />",
  prompt: recursionPrompt,
  notes:
    "Rendered inline as role=dialog with aria-modal=false, since it never " +
    "takes the page modal. The count and the message are live regions.",
  lines: {
    dialog: "Cancel goes back one. Everything else goes forward.",
    "dialog-close": "This is not an exit.",
    "dialog-restart": "It missed you.",
  },
};
