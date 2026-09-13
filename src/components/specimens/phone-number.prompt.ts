export const phoneNumberPrompt = `WHAT TO BUILD
Build a portable React + TypeScript ten-digit phone-number stepper named PhoneNumber. It takes no props and is used as <PhoneNumber />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible “Phone number” label and “+1” country code.
- Give the ten controls a parent with role="group" and connect it to the visible label with aria-labelledby.
- Divide the controls visually into groups covering indices 0–2, 3–5, and 6–9, with aria-hidden en dashes between groups.
- Each digit is a type="button" with an aria-label exactly in the form “Increase digit N, currently D”, where N is its one-based position and D is its current value.
- Inside each button, render an aria-hidden upward chevron, the visible digit, and a decorative underline.
- Finish with an “Adjust digits” hint and an aria-hidden chain-link icon.

BEHAVIOR
- Store exactly ten digits, all initially 0, plus the index of the most recently pressed digit, initially null.
- Pressing index i increments both digit i and digit (i + 1) modulo 10. Each digit value also wraps modulo 10, so 9 becomes 0.
- The tenth control therefore increments both the tenth and first digits.
- After a press, visually mark only the successor, index (i + 1) modulo 10, as connected. Do not mark the pressed digit unless it is the successor of the previous press.
- Keep each button’s accessible name synchronized with its current digit.

STYLING
- The specimen is width 100%, max-width 310px, centered, color #282824. The heading is a 12px flex row with 20px line-height and space between; the country code is 12px monospace in #6b6b63.
- Lay out digits with flex, space-between, 3px gap, and 22px top margin. Each digit group is flex: 1 1 0 with a 3px gap; the final group has flex-grow 1.25.
- Each digit button is a vertical centered flex item, flex 1, min-width 0, height 87px, padding 9px 0 15px, 1px solid #deded6 border, 4px radius, #ffffff background, #282824 text, 22px monospace type, and 8px internal gap.
- On hover use background #f7f8f2 and border #a3aa95; active background #e3e9d8; focus-visible outline 2px solid #6c7660 at 3px offset. The connected button uses background #f3f0e5 and border #ccc5ad.
- The chevron is 11px square in #939389. The underline is absolute at bottom 10px, 6px by 1px, background #d3d3c9. Separators use 13px 1px 0 padding, 12px type, color #8c8c80.
- The footer is a flex row spaced apart with 21px top margin and color #6b6b63; its hint is 11px. Transitions for button background and border are 140ms ease and are removed for reduced motion.
- At widths up to 600px, reduce digit type to 20px.

DONE WHEN
- Every press changes exactly two adjacent digits with both value and position wrapping.
- All ten controls retain native button keyboard behavior and announce their position and current value.
- Grouping, successor highlight, hover, active, focus, footer, and mobile sizing match the specification.
`;
