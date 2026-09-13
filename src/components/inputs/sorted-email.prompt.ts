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
- The specimen is width 100%, max-width 310px, centered, color #282824.
- The heading is a 12px flex row, 20px line-height, space-between, 12px gap. The “A→z” text is 11px monospace in #6b6b63.
- The input is display block, border-box, width 100%, height 44px, 10px top margin, 0 12px padding, 1px solid #deded6 border, 4px radius, #ffffff background, color #282824, 15px monospace. Placeholder color #8c8c80. Hover border #a3aa95. Focus-visible outline 2px solid #6c7660 at 3px offset. Border transition 140ms ease, removed under prefers-reduced-motion.
- The hint has 12px top margin, 11px type, line-height 1.5, color #6b6b63.

DONE WHEN
- After any typing, deleting, or pasting, the value is in ascending code unit order.
- The caret sits after the last character following each change.
- The input is labelled, described by the hint, and styled as specified.
`;
