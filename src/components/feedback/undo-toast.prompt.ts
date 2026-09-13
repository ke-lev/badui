export const undoToastPrompt = `WHAT TO BUILD
Build a portable React + TypeScript file list with an undo toast, named UndoToast. It takes no props and is used as <UndoToast />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a position-relative container. At the top, a row with a paragraph “Files” (tabIndex -1, used as a focus target) and a caption “N of 4”.
- Below it, a bordered list of the remaining files. Each item shows the file name and a type="button" “Delete” with aria-label “Delete NAME”.
- When no files remain, replace the list with a bordered panel reading “No files.” and a type="button" “Restore all”.
- Always render a div with role="status" and aria-live="polite", absolutely positioned along the bottom of the container. While a deletion is pending it contains the toast: the text “NAME deleted.”, a type="button" “Undo”, and an aria-hidden countdown bar.

BEHAVIOR
- Files start as, in order: budget.xlsx, meeting-notes.txt, poster.png, minutes.docx.
- Delete removes that file and sets the pending deletion to its name and original index, with a sequence number one higher than the previous. Key the toast element by the sequence so a new deletion remounts it and restarts its countdown animation. A new deletion replaces any existing toast; the earlier deletion can no longer be undone.
- Whenever a deletion is pending, start a 5000ms timeout that dismisses the toast; restart it whenever the pending deletion changes and clear it on change or unmount.
- The toast dismisses immediately on pointerenter. This applies to any pointer type, including touch.
- Dismissing: if focus is inside the toast, move focus to the “Files” paragraph first; then clear the pending deletion.
- Undo reinserts the file at its original index, clears the pending deletion, and focuses that file's Delete button after the list re-renders.
- After Delete, focus the Delete button of the file that now occupies the removed position, else the file above it, else the “Files” paragraph.
- Restore all resets the list to the original four files, clears any pending deletion, and focuses the first file's Delete button.

STYLING
- The container is width 100%, max-width 320px, min-height 272px, centered, color #282824.
- The title row is a baseline flex row, space-between, 8px bottom margin; the title is 13px weight 500, no margin, 3px radius; the caption is 11px #6b6b63.
- The list and empty panel have a 1px solid #deded6 border, 6px radius, white background. Items are flex rows, space-between, 12px gap, min-height 46px, padding 0 6px 0 14px, 13px type, with a 1px solid #eeeee8 border between items. The empty panel is a centered grid with 12px gap, padding 28px 16px, 12px #6b6b63 type.
- Delete buttons: min-height 32px, padding 4px 10px, transparent border and background, 5px radius, #6b6b63 12px type; hover #f3f3ec background and #282824 text. Restore all: min-height 39px, padding 8px 15px, 1px solid #ddddd5 border, 5px radius, white, #464640, 12px weight 500; hover border #bdbeb1 and background #f5f5ef.
- The toast is a relative flex row, space-between, 12px gap, overflow hidden, padding 10px 8px 12px 14px, 6px radius, background #30312b, color #fafaf6, 12px type, shadow 0 8px 20px rgba(40,40,36,0.14), entering with a 180ms cubic-bezier(0.2,0.8,0.2,1) animation from opacity 0 and translateY(8px).
- Undo: min-height 30px, padding 4px 10px, no border, 4px radius, transparent background, color #e6e9dc, weight 500, underlined with 3px offset; hover background #4d5142; focus-visible outline 2px solid #e6e9dc at 1px offset.
- The countdown bar is absolutely positioned along the toast's bottom edge, 3px tall, #a3aa95, transform-origin left, animating from full width to scaleX(0) over 5000ms linear, forwards.
- Other focus-visible outlines are 2px solid #667251 at 3px offset. Under prefers-reduced-motion: reduce, remove button transitions and the toast entrance, and hide the countdown bar.

DONE WHEN
- Each delete shows a toast that closes after five seconds or as soon as a pointer enters it, whichever comes first.
- Undo restores the file to its original place, a second delete replaces the toast and restarts the timer, and Restore all brings back all four files.
- Focus never falls to the document body when a button disappears, and each deletion is announced through the status region.
`;
