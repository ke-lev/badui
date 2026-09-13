import styles from "./buttons.module.css";

export function Arrow() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Readout({ presses }: { presses: number }) {
  return (
    <p className={styles.readout} role="status" aria-live="polite" aria-atomic="true">
      <span>Presses</span>
      <span className={styles.count}>{presses}</span>
    </p>
  );
}
