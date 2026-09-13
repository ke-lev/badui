export const leadingCaretPrompt = `WHAT TO BUILD
Build a portable React + TypeScript text field named LeadingCaret. It takes no props and is used as <LeadingCaret />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible label “Full name” connected to the input with htmlFor and id, and, on the right, the current character count of the value.
- Below it, a controlled native input with type="text", autoComplete="off", spellCheck false, and placeholder “Jane Appleseed”.
- Finish with a paragraph: “As it appears on your card.”

BEHAVIOR
- The value starts empty and is updated from every change event without modification.
- In a layout effect that runs whenever the value changes, if the input is the focused element, call setSelectionRange(0, 0) so the caret is at the start before the browser paints.
- On focus, also call setSelectionRange(0, 0).
- Nothing else is intercepted: native editing keys, selection, and paste behave as usual until the next change moves the caret back to the start. Typing J, a, n, e in that order therefore produces “J”, then “aJ”, then “naJ”, then “enaJ”.

STYLING
- The specimen is width 100%, max-width 310px, centered, color #282824.
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The count is 11px monospace in #6b6b63.
- The input is display block, border-box, width 100%, height 44px, 10px top margin, 0 12px padding, 1px solid #deded6 border, 4px radius, #ffffff background, color #282824, 15px monospace. Placeholder color #8c8c80. Hover border #a3aa95. Focus-visible outline 2px solid #6c7660 at 3px offset. Border transition 140ms ease, removed under prefers-reduced-motion.
- The paragraph has 12px top margin, 11px type, line-height 1.5, color #6b6b63.

DONE WHEN
- Each typed character is inserted before every character already in the field.
- The caret is at the start after every change and on focus, with no visible flicker to another position.
- The label, count, placeholder, hint, and focus ring match the specification.
`;
