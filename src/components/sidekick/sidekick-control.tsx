"use client";

import styles from "./sidekick.module.css";
import { useSidekickMode, type SidekickMode } from "./sidekick-mode";

const OPTIONS: Array<{ value: SidekickMode; label: string }> = [
  { value: "dom", label: "DOM" },
  { value: "talk", label: "Talk" },
  { value: "off", label: "Off" },
];

export function SidekickControl() {
  const { mode, setMode } = useSidekickMode();

  return (
    <fieldset className={styles.control}>
      <legend className={styles.legend}>
        <span className={styles.mark} aria-hidden="true" />
        <span className="sr-only">Cursor companion</span>
      </legend>
      {OPTIONS.map((option) => (
        <label className={styles.option} key={option.value} data-sidekick={`sidekick-${option.value}`}>
          <input
            type="radio"
            name="sidekick-mode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => setMode(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

// The splash route has no site footer, so the mode control had nowhere to live
// there — a visitor landing on "/" with talk already stored had no way to turn
// it off until they navigated. This docks the control in the corner instead:
// a real contentinfo landmark (which "/" otherwise lacks) with no surface of
// its own, so it sits on the page rather than on a bar.
export function SidekickDock() {
  return (
    <footer className={styles.dock}>
      <SidekickControl />
    </footer>
  );
}
