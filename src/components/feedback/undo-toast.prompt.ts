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
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The container is width 100%, max-width 320px, min-height 272px, centered, color light-dark(#282824, #e8e7e0).
- The title row is a baseline flex row, space-between, 8px bottom margin; the title is 13px weight 500, no margin, 3px radius; the caption is 11px light-dark(#6b6b63, #9c9c91).
- The list and empty panel have a 1px solid light-dark(#deded6, #34342f) border, 6px radius, light-dark(#ffffff, #1a1a17) background. Items are flex rows, space-between, 12px gap, min-height 46px, padding 0 6px 0 14px, 13px type, with a 1px solid light-dark(#eeeee8, #2a2a26) border between items. The empty panel is a centered grid with 12px gap, padding 28px 16px, 12px light-dark(#6b6b63, #9c9c91) type.
- Delete buttons: min-height 32px, padding 4px 10px, transparent border and background, 5px radius, light-dark(#6b6b63, #9c9c91) 12px type; hover light-dark(#f3f3ec, #20201d) background and light-dark(#282824, #e8e7e0) text. Restore all: min-height 39px, padding 8px 15px, 1px solid light-dark(#ddddd5, #34342f) border, 5px radius, light-dark(#ffffff, #1a1a17) background, light-dark(#464640, #c3c3b9) text, 12px weight 500; hover border light-dark(#bdbeb1, #4a4b43) and background light-dark(#f5f5ef, #20201d).
- The toast is a relative flex row, space-between, 12px gap, overflow hidden, padding 10px 8px 12px 14px, 6px radius, background light-dark(#30312b, #e8e7e0), color light-dark(#fafaf6, #1a1a17), 12px type, shadow 0 8px 20px light-dark(rgba(40,40,36,0.14), rgba(0,0,0,0.45)), entering with a 180ms cubic-bezier(0.2,0.8,0.2,1) animation from opacity 0 and translateY(8px).
- Undo: min-height 30px, padding 4px 10px, no border, 4px radius, transparent background, color light-dark(#e6e9dc, #2b3125), weight 500, underlined with 3px offset; hover background light-dark(#4d5142, #cdd1c2); focus-visible outline 2px solid light-dark(#e6e9dc, #2b3125) at 1px offset.
- The countdown bar is absolutely positioned along the toast's bottom edge, 3px tall, light-dark(#a3aa95, #8f9880), transform-origin left, animating from full width to scaleX(0) over 5000ms linear, forwards.
- Other focus-visible outlines are 2px solid light-dark(#667251, #8e9c78) at 3px offset. Under prefers-reduced-motion: reduce, remove button transitions and the toast entrance, and hide the countdown bar.

DONE WHEN
- Each delete shows a toast that closes after five seconds or as soon as a pointer enters it, whichever comes first.
- Undo restores the file to its original place, a second delete replaces the toast and restarts the timer, and Restore all brings back all four files.
- Focus never falls to the document body when a button disappears, and each deletion is announced through the status region.
`;
