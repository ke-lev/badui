export const quantityStepperPrompt = `WHAT TO BUILD
Build a portable React + TypeScript quantity stepper named QuantityStepper. It takes no props and is used as <QuantityStepper />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible “Quantity” label (give it an id) and, on the right, the text “±10%”.
- Below it, a single row containing, in order: a type="button" with visible text “−” and aria-label “Decrease quantity”; a div with role="spinbutton", tabIndex 0, aria-labelledby pointing at the Quantity label, aria-valuemin 1, aria-valuemax 999, and aria-valuenow equal to the quantity, showing the quantity as its text; a type="button" with visible text “+” and aria-label “Increase quantity”.
- Finish with a paragraph: “Each step is ten percent of the current quantity.”

BEHAVIOR
- The quantity is an integer that starts at 12.
- A step up computes Math.round((q * 11) / 10); a step down computes Math.round((q * 9) / 10). Use this integer form so exact halves round up (4.5 becomes 5, 16.5 becomes 17). Clamp the result to 1–999.
- The consequences are intended: from 12, stepping down goes 11, 10, 9, 8, 7, 6, 5 and then stays at 5. Stepping up from 5 goes 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28 and so on. Any value from 1 to 4 does not change when stepped up.
- The − button steps down and the + button steps up, once per click.
- While the spinbutton has focus, ArrowUp steps up and ArrowDown steps down, each calling preventDefault. No other keys are handled.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The “±10%” text is 11px monospace in light-dark(#6b6b63, #9c9c91).
- The row has 10px top margin, 1px solid light-dark(#deded6, #34342f) border, 4px radius, light-dark(#ffffff, #1a1a17) background, and is a flex row with stretched items.
- Each button is flex 0 0 56px with no border, transparent background, color light-dark(#282824, #e8e7e0), 18px type, pointer cursor. The − button has a 1px solid light-dark(#deded6, #34342f) right border and 3px 0 0 3px radius; the + button has a 1px solid light-dark(#deded6, #34342f) left border and 0 3px 3px 0 radius. Hover background light-dark(#f7f8f2, #20201d); active background light-dark(#e3e9d8, #2b3125).
- The spinbutton is flex 1, 18px vertical padding, 34px monospace, line-height 1.1, letter-spacing -1.5px, centered, tabular numerals.
- Buttons and spinbutton show a 2px solid light-dark(#6c7660, #8e9c78) outline at 3px offset on focus-visible.
- The paragraph has 12px top margin, 11px type, line-height 1.5, color light-dark(#6b6b63, #9c9c91).
- Button background transitions are 140ms ease and are removed under prefers-reduced-motion.

DONE WHEN
- The quantity starts at 12, and every step changes it by ten percent of its current value, rounded half up, clamped to 1–999.
- Stepping down from 12 stops at 5; stepping up from any value 1–4 does not change it.
- The spinbutton announces its label and value, responds to ArrowUp and ArrowDown, and both buttons keep native keyboard behavior.
`;
