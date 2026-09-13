"use client";

import styles from "./sidekick.module.css";
import { useSidekickMode, type SidekickMode } from "./sidekick-mode";

const OPTIONS: Array<{ value: SidekickMode; label: string }> = [
  { value: "dom", label: "DOM" },
  { value: "snark", label: "Snark" },
  { value: "off", label: "Off" },
];

export function SidekickControl() {
  const { mode, setMode } = useSidekickMode();

  return (
    <fieldset className={styles.control}>
      <legend className={styles.legend}>Sidekick</legend>
      {OPTIONS.map((option) => (
        <label className={styles.option} key={option.value}>
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
