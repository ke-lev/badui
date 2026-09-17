"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advance, clamp, dampingFor, gapTo, spring } from "@/components/buttons/flee";
import {
  EPSILON,
  FAR,
  HEIGHT_STIFFNESS,
  LABEL_FADE,
  RATIO,
  WIDTH_STIFFNESS,
} from "@/components/buttons/shrinking-button";
import type { ComponentMeta } from "@/components/meta";
import { TOAST_MS } from "./rules";
import { skittishPrompt } from "./skittish.prompt";
import styles from "./feedback.module.css";

const FILES = ["budget.xlsx", "meeting-notes.txt", "poster.png", "minutes.docx"];
const SHADOW_FADE = 0.2; // the whole toast fades over the last this-much of the shrink

type Deletion = { name: string; index: number; sequence: number };

export function Skittish() {
  const [files, setFiles] = useState(FILES);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
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

  // The shrinking button's collapse, except it never regrows: once a pointer
  // comes within FAR of the toast's edge, it shrinks all the way to nothing
  // and is dismissed there.
  useEffect(() => {
    const specimen = specimenRef.current;
    const toast = toastRef.current;
    if (!deletion || !specimen || !toast) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = spring(0);
    const height = spring(0);
    const heightDamping = dampingFor(HEIGHT_STIFFNESS, RATIO);
    const widthDamping = dampingFor(WIDTH_STIFFNESS, RATIO);
    const computed = getComputedStyle(toast);
    const padding = [
      computed.paddingTop,
      computed.paddingRight,
      computed.paddingBottom,
      computed.paddingLeft,
    ].map(Number.parseFloat);
    let natural = { x: 0, y: 0 };
    let triggered = false;
    let frame = 0;
    let last = 0;

    // Real width, height, and padding, centred in the space it occupied at
    // full size, so the pressable area is the drawn one.
    function paint() {
      const kx = Math.max(0, 1 - width.value);
      const ky = Math.max(0, 1 - height.value);
      const w = natural.x * kx;
      const h = natural.y * ky;
      const s = toast!.style;
      s.width = `${w}px`;
      s.height = `${h}px`;
      s.marginLeft = `${(natural.x - w) / 2}px`;
      s.marginTop = s.marginBottom = `${(natural.y - h) / 2}px`;
      s.padding =
        `${padding[0] * ky}px ${padding[1] * kx}px ${padding[2] * ky}px ${padding[3] * kx}px`;
      s.borderRadius = `${Math.min(6, h / 2)}px`;
      const shrunk = Math.max(width.value, height.value);
      s.setProperty("--toast-content", `${clamp(1 - shrunk / LABEL_FADE, 0, 1)}`);
      s.opacity = `${clamp((1 - Math.min(width.value, height.value)) / SHADOW_FADE, 0, 1)}`;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (reduced) {
        width.value = height.value = 1;
        width.velocity = height.velocity = 0;
      } else {
        advance(height, 1, dt, HEIGHT_STIFFNESS, heightDamping, EPSILON);
        advance(width, 1, dt, WIDTH_STIFFNESS, widthDamping, EPSILON);
      }
      paint();
      if (width.value >= 1 && height.value >= 1) {
        frame = 0;
        dismiss();
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event: PointerEvent) {
      if (triggered) return;
      const rect = toast!.getBoundingClientRect();
      const half = { x: rect.width / 2, y: rect.height / 2 };
      const center = { x: rect.left + half.x, y: rect.top + half.y };
      if (gapTo({ x: event.clientX, y: event.clientY }, center, half) > FAR) return;
      triggered = true;
      natural = { x: toast!.offsetWidth, y: toast!.offsetHeight };
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    specimen.addEventListener("pointermove", onPointer, { passive: true });
    specimen.addEventListener("pointerdown", onPointer);

    return () => {
      cancelAnimationFrame(frame);
      specimen.removeEventListener("pointermove", onPointer);
      specimen.removeEventListener("pointerdown", onPointer);
    };
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
    <div className={`${styles.specimen} ${styles.toastSpecimen}`} ref={specimenRef}>
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
          <div className={styles.toast} ref={toastRef} key={deletion.sequence}>
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

export const skittishMeta: ComponentMeta = {
  name: "Skittish",
  kind: "hostile",
  category: "feedback",
  summary:
    "A file list where each delete raises a toast with Undo. The toast stays " +
    "for five seconds, drawing down a countdown bar. Once a pointer comes " +
    "within 16 pixels of its edge, it shrinks to nothing and closes.",
  usage: "<Skittish />",
  prompt: skittishPrompt,
  notes:
    "The toast renders inside a status region, so each deletion is announced. " +
    "The shrink is the Shrinking button's: width, height, and padding on " +
    "separate springs, height leading, contents fading over the first third. " +
    "It does not regrow when the pointer withdraws. Under " +
    "prefers-reduced-motion it closes without the shrink. " +
    "A second delete replaces the toast and restarts the five seconds. Undo " +
    "puts the file back in its original position. When the toast closes with " +
    "focus inside it, focus moves to the list title.",
  lines: {
    "toast-delete": "Deleted, with a short grace period.",
    "toast-undo": "It does not care to be approached.",
    "toast-restore": "All four, back where they were.",
  },
};
