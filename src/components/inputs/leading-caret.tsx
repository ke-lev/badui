"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { leadingCaretPrompt } from "./leading-caret.prompt";
import styles from "./inputs.module.css";

export function LeadingCaret() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  // After every change, before paint, the caret goes back to the start.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) input.setSelectionRange(0, 0);
  }, [value]);

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <label htmlFor={inputId}>Full name</label>
        <span className={styles.aside}>{value.length}</span>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.textInput}
        type="text"
        data-sidekick="leading-caret"
        value={value}
        autoComplete="off"
        spellCheck={false}
        placeholder="Jane Appleseed"
        onChange={(event) => setValue(event.target.value)}
        onFocus={(event) => event.currentTarget.setSelectionRange(0, 0)}
      />
      <p className={styles.hint}>As it appears on your card.</p>
    </div>
  );
}

export const leadingCaretMeta: ComponentMeta = {
  name: "Leading caret",
  kind: "hostile",
  category: "inputs",
  summary:
    "A full-name field that returns its caret to the start after every change and " +
    "on focus.",
  usage: "<LeadingCaret />",
  prompt: leadingCaretPrompt,
  notes:
    "A native text input with a visible label. The caret is reset with " +
    "setSelectionRange(0, 0) in a layout effect, before paint. A running " +
    "character count sits beside the label.",
  lines: {
    "leading-caret": "Always room at the front.",
  },
};
