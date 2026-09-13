"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { TOAST_MS } from "./rules";
import { undoToastPrompt } from "./undo-toast.prompt";
import styles from "./feedback.module.css";

const FILES = ["budget.xlsx", "meeting-notes.txt", "poster.png", "minutes.docx"];

type Deletion = { name: string; index: number; sequence: number };

export function UndoToast() {
  const [files, setFiles] = useState(FILES);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const name = pendingFocus.current;
    if (name === null) return;
    pendingFocus.current = null;
    (deleteButtons.current.get(name) ?? titleRef.current)?.focus();
  }, [files]);

  const dismiss = useCallback(() => {
    if (toastRef.current?.contains(document.activeElement)) titleRef.current?.focus();
    setDeletion(null);
  }, []);

  useEffect(() => {
    if (!deletion) return;
    const timer = window.setTimeout(dismiss, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [deletion, dismiss]);

  function remove(index: number) {
    const name = files[index];
    // Focus lands on the file that takes this one's place, or the one above.
    pendingFocus.current = files[index + 1] ?? files[index - 1] ?? "";
    setFiles(files.filter((_, position) => position !== index));
    setDeletion((current) => ({ name, index, sequence: (current?.sequence ?? 0) + 1 }));
  }

  function undo() {
    if (!deletion) return;
    const { name, index } = deletion;
    pendingFocus.current = name;
    setFiles((current) => [...current.slice(0, index), name, ...current.slice(index)]);
    setDeletion(null);
  }

  function restoreAll() {
    pendingFocus.current = FILES[0];
    setFiles(FILES);
    setDeletion(null);
  }

  return (
    <div className={`${styles.specimen} ${styles.toastSpecimen}`}>
      <div className={styles.listHead}>
        <p className={styles.listTitle} tabIndex={-1} ref={titleRef}>Files</p>
        <p className={styles.meta}>{files.length} of {FILES.length}</p>
      </div>
      {files.length === 0 ? (
        <div className={`${styles.surface} ${styles.emptyFiles}`}>
          <span>No files.</span>
          <button type="button" className={styles.secondaryButton} data-sidekick="toast-restore" onClick={restoreAll}>
            Restore all
          </button>
        </div>
      ) : (
        <ul className={`${styles.files} ${styles.surface}`}>
          {files.map((name, index) => (
            <li className={styles.file} key={name}>
              <span>{name}</span>
              <button
                type="button"
                ref={(node) => {
                  if (node) deleteButtons.current.set(name, node);
                  else deleteButtons.current.delete(name);
                }}
                className={styles.rowButton}
                data-sidekick="toast-delete"
                aria-label={`Delete ${name}`}
                onClick={() => remove(index)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.toastRegion} role="status" aria-live="polite">
        {deletion && (
          <div className={styles.toast} ref={toastRef} key={deletion.sequence} onPointerEnter={dismiss}>
            <span>{deletion.name} deleted.</span>
            <button type="button" className={styles.toastUndo} data-sidekick="toast-undo" onClick={undo}>
              Undo
            </button>
            <span className={styles.countdown} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

export const undoToastMeta: ComponentMeta = {
  name: "Undo toast",
  kind: "hostile",
  category: "feedback",
  summary:
    "A file list where each delete raises a toast with Undo. The toast stays " +
    "for five seconds, drawing down a countdown bar, and closes the moment a " +
    "pointer enters it.",
  usage: "<UndoToast />",
  prompt: undoToastPrompt,
  notes:
    "The toast renders inside a status region, so each deletion is announced. " +
    "A second delete replaces the toast and restarts the five seconds. Undo " +
    "puts the file back in its original position. When the toast closes with " +
    "focus inside it, focus moves to the list title.",
  lines: {
    "toast-delete": "Deleted, with a short grace period.",
    "toast-undo": "It does not care to be approached.",
    "toast-restore": "All four, back where they were.",
  },
};
