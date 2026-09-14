export const oneTimeCodePrompt = `WHAT TO BUILD
Build a portable React + TypeScript six-digit verification code field named OneTimeCode. It takes no props and is used as <OneTimeCode />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible label “Verification code” connected to the input with htmlFor and id, and, on the right, the text “Sent to •••• 0142”.
- Below it, a relatively positioned field wrapper containing an aria-hidden grid of six cells and, layered over the cells, one controlled native input.
- The input has type="text", inputMode="numeric", autoComplete="one-time-code", pattern="\\d{6}", no maxLength, and aria-describedby pointing at the status text.
- Below the field, a row with a status span (role="status", with an id) and a type="button" “Clear” button.
- There is exactly one input, one tab stop, and one accessible name; the cells are presentation only.

BEHAVIOR
- The code starts empty. On every change, remove every non-digit from the input’s value and keep the first six digits. Do not use maxLength, which would truncate pasted text such as “123 456” before the space is removed.
- Cell i shows the code’s digit at index i, or nothing.
- The active cell is index min(code length, 5). Mark it only while the input has focus.
- On the input’s select event, if the selection is not a collapsed caret at the end of the value, set it to the end. Editing therefore always happens at the end, and Backspace removes the last digit.
- Status text is “Code entered.” when six digits are present, otherwise “N digits remaining” with N = 6 − length.
- Clear empties the code and focuses the input. It is disabled while the code is empty.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The right-hand text is 11px monospace in light-dark(#6b6b63, #9c9c91).
- The field wrapper has 10px top margin. The input is absolutely positioned to fill it, with no margin, padding, border, or outline, transparent background, transparent text, transparent caret color, 16px font size (prevents zoom on iOS), text cursor, and a transparent ::selection background.
- The cells are a grid of six equal columns with a 6px gap and pointer-events none. Each cell is a centered grid, height 56px, 1px solid light-dark(#deded6, #34342f) border, 4px radius, light-dark(#ffffff, #1a1a17) background, 24px monospace, tabular numerals. Hovering the field makes cell borders light-dark(#c9ccbd, #4a4b43).
- The active cell has border light-dark(#6c7660, #8e9c78) and box-shadow 0 0 0 1px light-dark(#6c7660, #8e9c78). When the active cell is empty, draw a 1px by 24px light-dark(#282824, #e8e7e0) bar in it with an ::after that blinks: opacity 0 at 50%, 1s steps(1) infinite.
- When the input is focus-visible, give the cell grid a 2px solid light-dark(#6c7660, #8e9c78) outline at 4px offset with a 6px radius.
- The status row is a flex row with space-between, min-height 32px, 14px top margin, 11px type, color light-dark(#6b6b63, #9c9c91); when complete, the status text is light-dark(#4f5a3d, #a9b894).
- The Clear button has min-height 32px, padding 6px 12px, 1px solid light-dark(#deded6, #34342f) border, 4px radius, light-dark(#ffffff, #1a1a17) background, color light-dark(#282824, #e8e7e0), 12px type; hover (when enabled) background light-dark(#f7f8f2, #20201d) and border light-dark(#a3aa95, #62635a); disabled color light-dark(#6b6b63, #9c9c91) with default cursor; focus-visible outline 2px solid light-dark(#6c7660, #8e9c78) at 3px offset.
- Cell border and shadow transitions are 140ms ease. Under prefers-reduced-motion remove the transitions and the blink.
- At widths up to 600px, cells are 50px tall with 20px type.

DONE WHEN
- Typing, pasting “123 456”, and one-time-code autofill all produce six digits in the cells, left to right.
- Non-digits never appear; a seventh digit is ignored.
- The caret cannot be moved into the middle of the code, and Backspace removes the last digit.
- The field is a single labelled input, and the status region reports the digits remaining and completion.
`;
