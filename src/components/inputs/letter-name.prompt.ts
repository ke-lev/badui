export const letterNamePrompt = `WHAT TO BUILD
Build a portable React + TypeScript first-name field named LetterName. It takes no props and is used as <LetterName />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible “First name” label (give it an id) and, on the right, a count in the form “N/12”, where N is the number of letters.
- Below it, an output element with aria-live="polite" showing the composed name.
- Then a container with role="group" and aria-labelledby pointing at the First name label. It contains one native select per letter, each with aria-label “Letter N”, where N is its one-based position.
- Each select has 26 options in exactly this order: E T A O I N S H R D L C U M W F G Y P B V K J X Q Z. Each option’s value is the capital letter. Option text is the capital letter in the first select and the lower-case letter in every other select.
- Finish with a row of two type="button" buttons: “Remove letter” on the left and “Add letter” on the right.

BEHAVIOR
- Letters are stored as an array of capital letters, initially ["K"].
- Changing a select replaces the letter at its position.
- The composed name is the first letter as a capital followed by every later letter in lower case.
- Add letter appends "E" (the first option) and then, on the next animation frame, focuses the new last select. Add letter is disabled at 12 letters.
- Remove letter removes the last letter. It is disabled when one letter remains.

STYLING
- The specimen is width 100%, max-width 310px, centered, color #282824.
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The count is 11px monospace in #6b6b63.
- The output is display block, min-height 42px, padding 14px 0 12px, 1px solid #deded6 bottom border, 26px monospace, line-height 1.2, letter-spacing -1px, overflow-wrap anywhere.
- The select group is a wrapping flex row with a 4px gap and 16px top margin. Each select is 44px square with 14px left padding, 1px solid #deded6 border, 4px radius, #ffffff background, color #282824, 15px monospace, pointer cursor; hover border #a3aa95; focus-visible outline 2px solid #6c7660 at 2px offset.
- The button row is a flex row with space-between, an 8px gap and 16px top margin. Each button has min-height 32px, padding 6px 12px, 1px solid #deded6 border, 4px radius, #ffffff background, color #282824, 12px type, pointer cursor. Hover (when enabled) uses background #f7f8f2 and border #a3aa95. Disabled uses color #6b6b63 and a default cursor. Focus-visible outline is 2px solid #6c7660 at 3px offset. Background and border transitions are 140ms ease, removed under prefers-reduced-motion.

DONE WHEN
- The field starts as a single select showing K, with the name “K” and the count “1/12”.
- Every select lists letters in frequency order, E first and Z last, capitals only in the first select.
- Add letter appends an E and focuses it; Remove letter removes the last letter; both respect the 1–12 limits.
- The composed name updates in a polite live region.
`;
