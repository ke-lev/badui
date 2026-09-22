"use client";

import { useId, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { sortCharacters } from "./rules";
import { sortedEmailPrompt } from "./sorted-email.prompt";
import styles from "./inputs.module.css";

export function SortedEmail() {
  const inputId = useId();
  const [value, setValue] = useState("");

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Email address</label>
        <span className={styles.aside}>A→z</span>
      </div>
      <input
        id={inputId}
        className={styles.textInput}
        type="text"
        inputMode="email"
        data-sidekick="sorted-email"
        value={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="you@example.com"
        aria-describedby={`${inputId}-hint`}
        onChange={(event) => {
          const input = event.currentTarget;
          const sorted = sortCharacters(input.value);
          setValue(sorted);
          // The caret ends up after the last character.
          requestAnimationFrame(() => input.setSelectionRange(sorted.length, sorted.length));
        }}
      />
      <p className={styles.hint} id={`${inputId}-hint`}>Kept in order as you type.</p>
    </div>
  );
}

export const sortedEmailMeta: ComponentMeta = {
  name: "Sorted email",
  kind: "hostile",
  category: "inputs",
  summary:
    "An email field that sorts its value after every change: punctuation and digits, " +
    "then capitals, then lowercase. The caret lands at the end.",
  usage: "<SortedEmail />",
  prompt: sortedEmailPrompt,
  notes:
    "A native text input with inputmode=email rather than type=email, which " +
    "does not support setting the selection. Pasted text is sorted the same " +
    "way as typed text.",
  lines: {
    "sorted-email": "Everything in its place.",
  },
};
