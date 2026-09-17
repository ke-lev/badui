"use client";

import { useEffect, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import {
  advanceUpload,
  displayedPercent,
  secondsRemaining,
  UPLOAD_STALL,
  UPLOAD_TICK_MS,
} from "./rules";
import { asymptotePrompt } from "./asymptote.prompt";
import styles from "./feedback.module.css";

export function Asymptote() {
  // Distance left to 100, or null while no upload is running.
  const [remaining, setRemaining] = useState<number | null>(null);
  const uploading = remaining !== null;
  const percent = uploading ? displayedPercent(remaining) : 0;

  useEffect(() => {
    if (remaining === null || remaining < UPLOAD_STALL) return;
    const timer = window.setTimeout(() => setRemaining(advanceUpload(remaining)), UPLOAD_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return (
    <div className={`${styles.specimen} ${styles.surface} ${styles.upload}`}>
      <div className={styles.fileRow}>
        <span className={styles.fileName}>report-final.pdf</span>
        <span className={styles.meta}>4.2 MB</span>
      </div>
      <p className={styles.percent} aria-hidden="true">{percent.toFixed(1)}%</p>
      <div
        className={styles.track}
        role="progressbar"
        data-sidekick="upload-progress"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent.toFixed(1)}%`}
      >
        <div className={styles.fill} style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <div className={styles.uploadFoot}>
        <p className={styles.meta} role="status">
          {uploading ? `About ${secondsRemaining(remaining)} seconds remaining` : "Ready to upload"}
        </p>
        <button
          type="button"
          className={uploading ? styles.secondaryButton : styles.primaryButton}
          data-sidekick={uploading ? "upload-cancel" : "upload-start"}
          onClick={() => setRemaining(uploading ? null : 100)}
        >
          {uploading ? "Cancel" : "Upload"}
        </button>
      </div>
    </div>
  );
}

export const asymptoteMeta: ComponentMeta = {
  name: "Asymptote",
  kind: "hostile",
  category: "feedback",
  summary:
    "A file upload with a progress bar. Every quarter second the upload covers " +
    "a tenth of the distance left, so the readout climbs quickly, slows, and " +
    "holds at 99.9%. The estimate reads three seconds throughout.",
  usage: "<Asymptote />",
  prompt: asymptotePrompt,
  notes:
    "A role=progressbar with a one-decimal aria-valuetext. The estimate is " +
    "computed from the most recent tick's rate and sits in a status region. " +
    "Upload and Cancel are the same button, so focus stays put between them.",
  lines: {
    "upload-start": "It starts quickly.",
    "upload-progress": "Most of the way there, for some time now.",
    "upload-cancel": "Back to zero.",
  },
};
