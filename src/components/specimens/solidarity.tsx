"use client";

import { useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { Checkmark } from "./checkmark";
import styles from "./form-specimens.module.css";
import { solidarityPrompt } from "./solidarity.prompt";

const preferenceLabels = ["Email updates", "Product news", "Research invitations"];

export function Solidarity() {
  const [preferences, setPreferences] = useState([true, false, true]);
  const [saved, setSaved] = useState(false);
  const selectedCount = preferences.filter(Boolean).length;

  function togglePreference(index: number) {
    setPreferences((current) => current.map((selected, position) => (
      position === index || position === (index + 1) % current.length ? !selected : selected
    )));
  }

  if (saved) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}><Checkmark /></span>
        <p className={styles.successTitle}>Preferences saved.</p>
        <p className={styles.successDescription}>{selectedCount} preferences selected.</p>
        <button className={styles.secondaryButton} type="button" data-sidekick="checkboxes-edit" onClick={() => setSaved(false)}>
          Edit preferences
        </button>
      </div>
    );
  }

  return (
    <div className={styles.preferences}>
      <fieldset className={styles.preferenceFieldset} data-sidekick="checkboxes">
        <legend className={styles.fieldLabel}>Select your preferences</legend>
        <div className={styles.preferenceOptions}>
          {preferenceLabels.map((label, index) => (
            <label className={styles.preferenceOption} key={label}>
              <input
                type="checkbox"
                checked={preferences[index]}
                onChange={() => togglePreference(index)}
              />
              <span className={styles.checkboxVisual} aria-hidden="true"><Checkmark /></span>
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.preferenceActions}>
        <span className={styles.selectedCount} role="status">{selectedCount} selected</span>
        <button className={styles.primaryButton} type="button" data-sidekick="checkboxes-save" onClick={() => setSaved(true)}>
          Save preferences
        </button>
      </div>
    </div>
  );
}

export const solidarityMeta: ComponentMeta = {
  name: "Solidarity",
  kind: "hostile",
  category: "inputs",
  summary:
    "Three preference checkboxes. Toggling one also toggles the next in the " +
    "list, wrapping from the last back to the first; a running count sits " +
    "beside the save button.",
  usage: "<Solidarity />",
  prompt: solidarityPrompt,
  notes:
    "Native checkboxes in a labelled fieldset, so each reports its own " +
    "checked state. The count is a status region.",
  lines: {
    checkboxes: "Each one has an opinion about its neighbour.",
    "checkboxes-save": "Saves whatever it ended up as.",
    "checkboxes-edit": "They are where you left them. Roughly.",
  },
};
