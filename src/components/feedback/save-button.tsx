"use client";

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { SAVE_MS } from "./rules";
import { saveButtonPrompt } from "./save-button.prompt";
import styles from "./feedback.module.css";

const INITIAL_TITLE = "Quarterly review";

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function SaveButton() {
  const inputId = useId();
  const [draft, setDraft] = useState(INITIAL_TITLE);
  const [saved, setSaved] = useState(INITIAL_TITLE);
  // The value being written, or null when nothing is in flight.
  const [saving, setSaving] = useState<string | null>(null);
  const dirty = draft !== saved;
  const unavailable = saving !== null || !dirty;

  useEffect(() => {
    if (saving === null) return;
    const timer = window.setTimeout(() => {
      setSaved(saving);
      setSaving(null);
    }, SAVE_MS);
    return () => window.clearTimeout(timer);
  }, [saving]);

  function save() {
    if (!unavailable) setSaving(draft);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  function handleKey(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    save();
  }

  const status = saving !== null ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved";

  return (
    <form
      className={`${styles.specimen} ${styles.surface} ${styles.saveForm}`}
      onSubmit={submit}
      onKeyDown={handleKey}
    >
      <label className={styles.label} htmlFor={inputId}>Document title</label>
      <input
        id={inputId}
        className={styles.textInput}
        data-sidekick="save-field"
        value={draft}
        maxLength={60}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className={styles.saveFoot}>
        <p className={styles.saveStatus} role="status" aria-live="polite">
          <span
            className={`${styles.dot} ${saving === null ? (dirty ? styles.dotDirty : styles.dotSaved) : ""}`}
            aria-hidden="true"
          />
          {status}
        </p>
        <button
          type="submit"
          className={`${styles.primaryButton} ${styles.saveButton}`}
          data-sidekick="save-button"
          aria-disabled={unavailable}
        >
          {saving !== null ? (
            <><span className={styles.spinner} aria-hidden="true" /> Saving</>
          ) : dirty ? (
            "Save"
          ) : (
            <><Check /> Saved</>
          )}
        </button>
      </div>
    </form>
  );
}

export const saveButtonMeta: ComponentMeta = {
  name: "Save button",
  kind: "benign",
  category: "feedback",
  summary:
    "A title field with a save button that reports its own state: Save while " +
    "there are unsaved changes, Saving while a write is in flight, and Saved " +
    "once the stored value matches the field.",
  usage: "<SaveButton />",
  prompt: saveButtonPrompt,
  notes:
    "The button is aria-disabled rather than disabled while saving or saved, " +
    "so it never drops focus. Enter and Cmd or Ctrl+S save from the field. " +
    "The status line is a live region. Edits made during a save leave the " +
    "field unsaved once the write completes.",
  lines: {
    "save-field": "Changes stay here until they are saved.",
    "save-button": "It tells you what it did.",
  },
};
