"use client";

import { useId, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { letterNamePrompt } from "./letter-name.prompt";
import { LETTERS_BY_FREQUENCY, nameFrom } from "./rules";
import styles from "./inputs.module.css";

const MAX_LETTERS = 12;

export function LetterName() {
  const labelId = useId();
  const [letters, setLetters] = useState(["K"]);
  const lettersRef = useRef<HTMLDivElement>(null);
  const name = nameFrom(letters);

  function setLetter(index: number, letter: string) {
    setLetters((current) => current.map((existing, position) => (position === index ? letter : existing)));
  }

  function addLetter() {
    setLetters((current) => [...current, LETTERS_BY_FREQUENCY[0]]);
    // Focus the new select once it has rendered.
    requestAnimationFrame(() => lettersRef.current?.querySelector<HTMLSelectElement>("select:last-child")?.focus());
  }

  return (
    <div className={styles.specimen}>
      <div className={styles.heading}>
        <span id={labelId}>First name</span>
        <span className={styles.aside}>{letters.length}/{MAX_LETTERS}</span>
      </div>
      <output className={styles.nameReading} aria-live="polite">{name}</output>
      <div className={styles.letters} role="group" aria-labelledby={labelId} ref={lettersRef}>
        {letters.map((letter, index) => (
          <select
            key={index}
            className={styles.letterSelect}
            data-sidekick="name-letter"
            aria-label={`Letter ${index + 1}`}
            value={letter}
            onChange={(event) => setLetter(index, event.target.value)}
          >
            {LETTERS_BY_FREQUENCY.map((option) => (
              <option key={option} value={option}>{index === 0 ? option : option.toLowerCase()}</option>
            ))}
          </select>
        ))}
      </div>
      <div className={styles.nameActions}>
        <button
          type="button"
          className={styles.textButton}
          data-sidekick="name-remove"
          disabled={letters.length === 1}
          onClick={() => setLetters((current) => current.slice(0, -1))}
        >
          Remove letter
        </button>
        <button
          type="button"
          className={styles.textButton}
          data-sidekick="name-add"
          disabled={letters.length === MAX_LETTERS}
          onClick={addLetter}
        >
          Add letter
        </button>
      </div>
    </div>
  );
}

export const letterNameMeta: ComponentMeta = {
  name: "Letter-by-letter name",
  kind: "hostile",
  category: "inputs",
  summary:
    "A first-name field assembled from up to twelve letter dropdowns. The alphabet " +
    "runs from E to Z by English-letter frequency.",
  usage: "<LetterName />",
  prompt: letterNamePrompt,
  notes:
    "Native selects in a group labelled First name, each named by its " +
    "position. The first letter is shown in capitals, the rest in lower case. " +
    "The composed name is a polite live region, and a new letter takes focus.",
  lines: {
    "name-letter": "The alphabet, ranked.",
    "name-add": "Another one. It will be an E.",
    "name-remove": "Only ever the last one.",
  },
};
