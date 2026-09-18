"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { Checkmark } from "./checkmark";
import styles from "./form-specimens.module.css";
import { movingTargetPrompt } from "./moving-target.prompt";

export function MovingTarget() {
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
          type="text"
          className={visible ? undefined : styles.masked}
          data-sidekick="password"
          value={password}
          onChange={(event) => updatePassword(event.target.value)}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
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

export const movingTargetMeta: ComponentMeta = {
  name: "Moving target",
  kind: "hostile",
  category: "inputs",
  summary:
    "A password field that reveals its requirements as they are met: eight " +
    "characters and a number bring out a rule about how many numbers, and " +
    "meeting that one brings out a rule about vowels.",
  usage: "<MovingTarget />",
  prompt: movingTargetPrompt,
  notes:
    "The requirement list is a live region and each item states met or not " +
    "met to a screen reader. A rejected submit sets aria-invalid and returns " +
    "focus to the field. The field is a text input masked in CSS rather than " +
    "a native password input, so a screen reader reads the characters aloud.",
  lines: {
    password: "Meeting a requirement is how you find the next one.",
    "password-reveal": "Shows the password. Only the password.",
    "password-submit": "It will let you know.",
    "password-restart": "Once more, from nothing.",
  },
};
