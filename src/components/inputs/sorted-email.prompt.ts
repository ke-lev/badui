export const sortedEmailPrompt = `WHAT TO BUILD
Build a portable React + TypeScript email field named SortedEmail. It takes no props and is used as <SortedEmail />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a visible label “Email address” connected to the input with htmlFor and id, and, on the right, the text “A→z”.
- Below it, a controlled native input with type="text" (not type="email", which does not support setSelectionRange), inputMode="email", autoComplete="off", autoCapitalize="off", spellCheck false, placeholder “you@example.com”, and aria-describedby pointing at the hint.
- Finish with a hint paragraph, with an id: “Kept in order as you type.”

BEHAVIOR
- The value starts empty.
- On every change, split the input’s value into characters, sort them in ascending UTF-16 code unit order (compare with < and >, not localeCompare), join them, and store the result as the value. Digits and punctuation such as “.” and “@” therefore come before capitals, and capitals before lower case.
- After storing, on the next animation frame, set the selection to the end of the sorted value.
- Typed and pasted text are handled identically. For example, entering ada@example.com leaves the value .@aaacdeelmmopx.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The “A→z” text is 11px sans-serif in light-dark(#6b6b63, #9c9c91).
- The input is display block, border-box, width 100%, height 44px, 10px top margin, 0 12px padding, 1px solid light-dark(#deded6, #34342f) border, 4px radius, light-dark(#ffffff, #1a1a17) background, color light-dark(#282824, #e8e7e0), 15px sans-serif. Placeholder color light-dark(#8c8c80, #75756b). Hover border light-dark(#a3aa95, #62635a). Focus-visible outline 2px solid light-dark(#6c7660, #8e9c78) at 3px offset. Border transition 140ms ease, removed under prefers-reduced-motion.
- The hint has 12px top margin, 11px type, line-height 1.5, color light-dark(#6b6b63, #9c9c91).

DONE WHEN
- After any typing, deleting, or pasting, the value is in ascending code unit order.
- The caret sits after the last character following each change.
- The input is labelled, described by the hint, and styled as specified.
`;
