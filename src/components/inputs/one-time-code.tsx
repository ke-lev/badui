"use client";

import { useId, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { CODE_LENGTH, codeFrom } from "./rules";
import { oneTimeCodePrompt } from "./one-time-code.prompt";
import styles from "./inputs.module.css";

export function OneTimeCode() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const complete = code.length === CODE_LENGTH;
  // The cell the next digit lands in; the last cell once the code is full.
  const active = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Verification code</label>
        <span className={styles.aside}>Sent to •••• 0142</span>
      </div>
      <div className={styles.codeField}>
        <div className={styles.codeCells} aria-hidden="true">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <span
              key={index}
              className={`${styles.codeCell} ${focused && index === active ? styles.activeCell : ""}`}
            >
              {code[index] ?? ""}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.codeInput}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          // No maxLength: it would cut "123 456" before the space is dropped.
          data-sidekick="otp"
          value={code}
          aria-describedby={`${inputId}-status`}
          onChange={(event) => setCode(codeFrom(event.target.value))}
          // Editing happens at the end only, so the drawn cells always match.
          onSelect={(event) => {
            const input = event.currentTarget;
            const end = input.value.length;
            if (input.selectionStart !== end || input.selectionEnd !== end) input.setSelectionRange(end, end);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <div className={styles.codeStatus}>
        <span
          id={`${inputId}-status`}
          className={complete ? styles.codeComplete : ""}
          role="status"
        >
          {complete ? "Code entered." : `${CODE_LENGTH - code.length} digits remaining`}
        </span>
        <button
          type="button"
          className={styles.textButton}
          data-sidekick="otp-clear"
          disabled={code.length === 0}
          onClick={() => {
            setCode("");
            inputRef.current?.focus();
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export const oneTimeCodeMeta: ComponentMeta = {
  name: "One-time code",
  kind: "benign",
  category: "inputs",
  summary:
    "A six-digit verification code field drawn as six cells over a single " +
    "text input. Typing, pasting, and SMS autofill all fill it from the left; " +
    "anything that is not a digit is dropped.",
  usage: "<OneTimeCode />",
  prompt: oneTimeCodePrompt,
  notes:
    "One input, one tab stop, and one accessible name, with " +
    "autocomplete=one-time-code and inputmode=numeric. The cells are " +
    "aria-hidden; a status region counts the digits remaining. The caret is " +
    "held at the end so the cells always match the value.",
  lines: {
    otp: "Six digits, however they arrive.",
    "otp-clear": "Starts the code over.",
  },
};
