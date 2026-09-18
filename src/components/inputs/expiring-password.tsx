"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { editLease, expireLease, LEASE_MS, MAX_PASSWORD_LENGTH, passwordRequirements, type LeasedCharacter } from "./password-lease";
import { expiringPasswordPrompt } from "./expiring-password.prompt";
import styles from "./expiring-password.module.css";

export function ExpiringPassword() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const current = useRef<LeasedCharacter[]>([]);
  const composing = useRef(false);
  const selection = useRef<[number, number] | null>(null);
  const [characters, setCharacters] = useState<LeasedCharacter[]>([]);
  const [now, setNow] = useState(0);
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const value = characters.map((character) => character.value).join("");
  const requirements = passwordRequirements(value);
  const ready = requirements.every((requirement) => requirement.met);

  useEffect(() => {
    if (accepted) return;
    const timer = window.setInterval(() => {
      if (composing.current || !current.current.length) return;
      const time = Date.now();
      const before = current.current;
      const field = input.current;
      const next = expireLease(before, time, field?.selectionStart ?? 0);
      const removed = before.length - next.characters.length;
      setNow(time);
      if (!removed) return;
      if (document.activeElement === field) {
        selection.current = [next.position, expireLease(before, time, field?.selectionEnd ?? 0).position];
      }
      current.current = next.characters;
      setCharacters(next.characters);
    }, 100);
    return () => window.clearInterval(timer);
  }, [accepted]);

  useLayoutEffect(() => {
    if (!selection.current) return;
    input.current?.setSelectionRange(...selection.current);
    selection.current = null;
  }, [characters]);

  function edit(nextValue: string) {
    const time = Date.now();
    const edited = editLease(current.current, nextValue, time);
    const next = expireLease(edited, time);
    current.current = next.characters;
    setCharacters(next.characters);
    setNow(time);
    setStatus(nextValue !== nextValue.replace(/[^\x21-\x7e]/g, "")
      ? "Use letters, numbers and symbols without spaces."
      : "");
  }

  function reset() {
    current.current = [];
    setCharacters([]);
    setAccepted(false);
    setVisible(false);
    setStatus("");
    input.current?.focus();
  }

  return (
    <form className={styles.specimen} onSubmit={(event) => {
      event.preventDefault();
      if (accepted || composing.current) return;
      const time = Date.now();
      const live = expireLease(current.current, time).characters;
      current.current = live;
      setCharacters(live);
      setNow(time);
      if (!passwordRequirements(live.map((character) => character.value).join("")).every((requirement) => requirement.met)) {
        setStatus("The remaining characters do not meet all requirements.");
        return;
      }
      current.current = [];
      setCharacters([]);
      setAccepted(true);
      setStatus("Password accepted. Nothing was stored.");
    }}>
      <div className={styles.heading}>
        <label htmlFor={id}>Create password</label>
        <span className={styles.count}>{accepted ? "Accepted" : `${characters.length}/${MAX_PASSWORD_LENGTH}`}</span>
      </div>
      <div className={styles.field}>
        <input ref={input} id={id} type="text" className={visible ? undefined : styles.masked}
          data-sidekick="lease-password" value={value} readOnly={accepted}
          maxLength={MAX_PASSWORD_LENGTH} autoComplete="off" spellCheck={false}
          data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other"
          autoCapitalize="none" autoCorrect="off" aria-describedby={`${id}-requirements ${id}-status`}
          placeholder={accepted ? "Password accepted" : "Enter a password"}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={(event) => { composing.current = false; edit(event.currentTarget.value); }}
          onChange={(event) => edit(event.target.value)} />
        <button type="button" data-sidekick={visible ? "lease-hide" : "lease-reveal"}
          aria-label="Show password" aria-pressed={visible}
          disabled={accepted} onClick={() => setVisible(!visible)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
            strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible
              ? <><path d="M1.5 7S4.2 11.5 8 11.5 14.5 7 14.5 7" /><path d="m3.4 9.9-1.2 1.7" /><path d="M8 11.5v2" /><path d="m12.6 9.9 1.2 1.7" /></>
              : <><path d="M1.5 8S4.2 3.5 8 3.5 14.5 8 14.5 8 11.8 12.5 8 12.5 1.5 8 1.5 8Z" /><circle cx="8" cy="8" r="2" /></>}
          </svg>
        </button>
      </div>
      <div className={styles.receipt} aria-hidden="true">
        <div className={styles.leases}>
          {Array.from({ length: MAX_PASSWORD_LENGTH }, (_, index) => {
            const remaining = characters[index] ? Math.max(0, (characters[index].expiresAt - now) / LEASE_MS) : 0;
            return <span key={index} className={styles.lease} data-urgent={remaining > 0 && remaining <= .25}>
              <span style={{ transform: `scaleY(${remaining})` }} />
            </span>;
          })}
        </div>
      </div>
      <ul id={`${id}-requirements`} className={styles.requirements}>
        {requirements.map((requirement) => <li key={requirement.label} data-met={accepted || requirement.met}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            {accepted || requirement.met ? <path d="m2 6 2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" /> : <circle cx="6" cy="6" r="3" stroke="currentColor" />}
          </svg>
          <span className={styles.srOnly}>{accepted || requirement.met ? "Met: " : "Not met: "}</span>{requirement.label}
        </li>)}
      </ul>
      <p id={`${id}-status`} className={styles.status} role="status">{status}</p>
      {accepted
        ? <button type="button" className={styles.submit} data-sidekick="lease-reset" onClick={reset}>Start again</button>
        : <button type="submit" className={styles.submit} data-sidekick="lease-submit" disabled={!ready}>Create password</button>}
    </form>
  );
}

export const expiringPasswordMeta: ComponentMeta = {
  name: "Expiring password",
  kind: "hostile",
  category: "inputs",
  summary: "A password field with a eight-second lifetime for each character. Characters expire independently, and the requirements update against what remains. Editing does not renew unchanged characters.",
  usage: "<ExpiringPassword />",
  notes: "Accepts 8–24 printable ASCII characters without spaces, with uppercase, lowercase, a number and a symbol. The field is a text input masked in CSS rather than a native password input, so a screen reader reads the characters aloud. Each bar tracks one character. Paste and keyboard editing work; submission checks deadlines again. Acceptance clears the field and stops expiration. Nothing is stored or sent.",
  prompt: expiringPasswordPrompt,
  lines: {
    "lease-password": "Hurry up!",
    "lease-reveal": "Show",
    "lease-hide": "Hide",
    "lease-submit": "Subject to availability.",
    "lease-reset": "A fresh set of deadlines.",
  },
};
