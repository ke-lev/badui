export const doublingPrompt = `WHAT TO BUILD
Build a portable React + TypeScript results pager named Doubling. It takes no props and is used as <Doubling />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render an ordered list with aria-label="Results" and a start attribute equal to the first record number on the page. It holds three list items.
- Each item shows “Record NNN” on the left and “#NNN” on the right, where NNN is the record number padded to three digits. The right-hand copy is aria-hidden.
- Below the list, render a nav with aria-label="Pagination" containing, in order: a type="button" “Previous”; a paragraph with role="status", aria-live="polite", and aria-atomic="true" reading “Page N of 24”, with N in a strong element; and a type="button" “Next”.
- At page 1, Previous has aria-disabled="true"; at page 24, Next has aria-disabled="true". Use aria-disabled, not the disabled attribute, so a focused button keeps focus. Otherwise aria-disabled is false.

BEHAVIOR
- The page is an integer from 1 to 24 and starts at 1. Each page shows three records: the first is (page - 1) * 3 + 1.
- Next sets the page to Math.min(page * 2, 24). Previous sets it to Math.max(Math.floor(page / 2), 1).
- The consequences are intended: from page 1, Next visits 2, 4, 8, 16, 24; from 24, Previous visits 12, 6, 3, 1; from 3, Next visits 6, 12, 24. Pages 5, 7, 9–11, 13–15, and 17–23 are never shown.
- A click on an aria-disabled button does nothing.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 330px, centered, color light-dark(#282824, #e8e7e0).
- The list has no margin, padding, or bullets, a 1px solid light-dark(#deded6, #34342f) border, 6px radius, and light-dark(#ffffff, #1a1a17) background. Each item is a flex row, space-between, min-height 46px, padding 0 16px, 13px type; items after the first have a 1px solid light-dark(#eaeaea, #2a2a26) top border. The “#NNN” text is 11px sans-serif with tabular numerals in light-dark(#6b6b63, #9c9c91).
- The nav is a three-column grid (auto, 1fr, auto), centered vertically, 8px gap, 12px top margin.
- Buttons have min-height 36px, padding 6px 12px, 1px solid light-dark(#deded6, #34342f) border, 5px radius, light-dark(#ffffff, #1a1a17) background, color light-dark(#282824, #e8e7e0), 12px inherited type, pointer cursor, and 140ms ease transitions on background and border color. When not aria-disabled, hover uses border light-dark(#a9aa9f, #62635a) and background light-dark(#f7f7f2, #20201d). aria-disabled buttons use color light-dark(#6b6b63, #9c9c91) and a default cursor.
- The status is centered 12px light-dark(#6b6b63, #9c9c91) with no margin; the page number is light-dark(#282824, #e8e7e0), sans-serif, weight 500, tabular numerals.
- Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) at 2px offset. Remove transitions under prefers-reduced-motion: reduce.

DONE WHEN
- Next doubles and Previous halves (rounding down) within 1–24, and the record numbers follow the page.
- The status region announces the page, and end buttons are aria-disabled without losing focus.
`;
