"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { checkboxGroupPrompt } from "./checkbox-group.prompt";
import { confirmDialogPrompt } from "./confirm-dialog.prompt";
import styles from "./form-specimens.module.css";
import { passwordFieldPrompt } from "./password-field.prompt";

function Checkmark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PasswordField() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const hasAccepted = useRef(false);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const digits = password.match(/\d/g)?.length ?? 0;
  const requirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least one number", met: digits > 0 },
    ...(stage >= 1
      ? [{ text: "Exactly 3 numbers", met: digits === 3 }]
      : []),
    ...(stage >= 2
      ? [{ text: "No vowels. Including y.", met: !/[aeiouy]/i.test(password) }]
      : []),
  ];

  useEffect(() => {
    if (accepted) {
      hasAccepted.current = true;
      restartRef.current?.focus();
    } else if (hasAccepted.current) {
      inputRef.current?.focus();
    }
  }, [accepted]);

  function updatePassword(value: string) {
    setPassword(value);
    setSubmitted(false);
    const numberCount = value.match(/\d/g)?.length ?? 0;
    if (value.length >= 8 && numberCount > 0) {
      setStage((current) => Math.max(current, numberCount === 3 ? 2 : 1));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (stage === 2 && requirements.every((requirement) => requirement.met)) {
      setAccepted(true);
    } else {
      inputRef.current?.focus();
    }
  }

  function reset() {
    setPassword("");
    setVisible(false);
    setStage(0);
    setSubmitted(false);
    setAccepted(false);
  }

  if (accepted) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}><Checkmark /></span>
        <p className={styles.successTitle}>Password accepted.</p>
        <button ref={restartRef} className={styles.secondaryButton} data-sidekick="password-restart" onClick={reset} type="button">
          Start again
        </button>
      </div>
    );
  }

  return (
    <form className={styles.passwordForm} onSubmit={submit} noValidate>
      <label className={styles.fieldLabel} htmlFor={inputId}>Create a password</label>
      <div className={`${styles.passwordInput} ${submitted ? styles.invalidInput : ""}`}>
        <input
          ref={inputRef}
          id={inputId}
          name="password"
          type={visible ? "text" : "password"}
          data-sidekick="password"
          value={password}
          onChange={(event) => updatePassword(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter password"
          aria-describedby={`${inputId}-requirements`}
          aria-invalid={submitted || undefined}
        />
        <button
          type="button"
          className={styles.revealButton}
          data-sidekick="password-reveal"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <ul className={styles.requirements} id={`${inputId}-requirements`} aria-live="polite">
        {requirements.map((requirement) => (
          <li
            key={requirement.text}
            className={requirement.met ? styles.requirementMet : submitted ? styles.requirementUnmet : ""}
          >
            <span className={styles.ruleIcon} aria-hidden="true">
              {requirement.met ? <Checkmark /> : <span />}
            </span>
            <span>{requirement.text}</span>
            <span className={styles.srOnly}>{requirement.met ? ": met" : ": not met"}</span>
          </li>
        ))}
      </ul>
      <button className={styles.primaryButton} type="submit" data-sidekick="password-submit">Create password</button>
    </form>
  );
}

export const passwordFieldMeta: ComponentMeta = {
  name: "Password field",
  kind: "hostile",
  category: "specimens",
  summary:
    "A password field that reveals its requirements as they are met: eight " +
    "characters and a number bring out a rule about how many numbers, and " +
    "meeting that one brings out a rule about vowels.",
  usage: "<PasswordField />",
  prompt: passwordFieldPrompt,
  notes:
    "The requirement list is a live region and each item states met or not " +
    "met to a screen reader. A rejected submit sets aria-invalid and returns " +
    "focus to the field.",
  lines: {
    password: "Meeting a requirement is how you find the next one.",
    "password-reveal": "Shows the password. Only the password.",
    "password-submit": "It will let you know.",
    "password-restart": "Once more, from nothing.",
  },
};

const confirmations = [
  "Would you like to continue?",
  "Please confirm your confirmation.",
  "Are you sure you were sure?",
  "This will confirm the previous confirmation.",
  "One more confirmation is required.",
  "Your confirmation needs confirmation.",
];

export function ConfirmDialog() {
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

export const confirmDialogMeta: ComponentMeta = {
  name: "Confirmation dialog",
  kind: "hostile",
  category: "specimens",
  summary:
    "A confirmation dialog that counts. Continue and the close button each " +
    "raise the count by one and ask again; Cancel lowers it by one, and " +
    "cancelling the first dialog ends the sequence.",
  usage: "<ConfirmDialog />",
  prompt: confirmDialogPrompt,
  notes:
    "Rendered inline as role=dialog with aria-modal=false, since it never " +
    "takes the page modal. The count and the message are live regions.",
  lines: {
    dialog: "Cancel goes back one. Everything else goes forward.",
    "dialog-close": "This is not an exit.",
    "dialog-restart": "It missed you.",
  },
};

const preferenceLabels = ["Email updates", "Product news", "Research invitations"];

export function CheckboxGroup() {
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

export const checkboxGroupMeta: ComponentMeta = {
  name: "Checkboxes",
  kind: "hostile",
  category: "specimens",
  summary:
    "Three preference checkboxes. Toggling one also toggles the next in the " +
    "list, wrapping from the last back to the first; a running count sits " +
    "beside the save button.",
  usage: "<CheckboxGroup />",
  prompt: checkboxGroupPrompt,
  notes:
    "Native checkboxes in a labelled fieldset, so each reports its own " +
    "checked state. The count is a status region.",
  lines: {
    checkboxes: "Each one has an opinion about its neighbour.",
    "checkboxes-save": "Saves whatever it ended up as.",
    "checkboxes-edit": "They are where you left them. Roughly.",
  },
};
