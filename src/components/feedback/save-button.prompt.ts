export const saveButtonPrompt = `WHAT TO BUILD
Build a portable React + TypeScript title editor with a stateful save button, named SaveButton. It takes no props and is used as <SaveButton />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a form card containing a label “Document title” bound by htmlFor to a text input (useId), with maxLength 60, autoComplete off, and spellCheck false.
- Below the input, a row with a paragraph carrying role="status" and aria-live="polite" on the left, and a type="submit" button on the right.
- The status paragraph starts with an aria-hidden 7px dot, followed by the status text.
- The button carries aria-disabled="true" while unavailable (see Behavior) and "false" otherwise. Do not use the disabled attribute, so the button keeps focus.
- Button content: “Save” when there are unsaved changes; an aria-hidden spinner followed by “Saving” while saving; an aria-hidden check icon followed by “Saved” when there are no unsaved changes.

BEHAVIOR
- State: draft (the input value), saved (the stored value), and saving (the value being written, or null). draft and saved both start as “Quarterly review”; saving starts null.
- dirty = draft !== saved. unavailable = saving !== null || !dirty.
- Saving is triggered by submitting the form (the button or Enter in the input) or by Cmd+S or Ctrl+S anywhere in the form (compare the key case-insensitively and call preventDefault). Always call preventDefault on submit. When unavailable, a trigger does nothing; otherwise it sets saving to the current draft.
- While saving is not null, a 900ms timeout sets saved to the saving value and saving back to null. Clear it on change or unmount.
- The input stays editable during a save. Edits made during a save leave dirty true once the save completes, because saved holds the value captured when the save began.
- Status text: “Saving…” while saving; otherwise “Unsaved changes” if dirty; otherwise “All changes saved”.

STYLING
- The form is width 100%, max-width 320px, centered, color #282824, 1px solid #deded6 border, 6px radius, white background, padding 18px.
- The label is block, 12px weight 500, 8px bottom margin. The input is full width, min-height 42px, padding 8px 12px, 1px solid #deded6 border, 5px radius, white, 14px type, 140ms ease border transition, border #a3aa95 on hover.
- The bottom row is a centered flex row, space-between, 12px gap, 16px top margin. The status is an inline flex row with 7px gap, 11px #6b6b63 type, no margin. The dot is round: #a9aa9f while saving, #9a6b2f when dirty, #54614a when saved.
- The button is inline-flex centered, 8px gap, min-width 96px, min-height 39px, padding 8px 15px, 1px transparent border, 5px radius, 12px weight 500, line-height 1.5, pointer cursor, 150ms ease transitions on background and border color. Available: background #30312b, text #fafaf6, hover #4d5142. aria-disabled: border #deded6, background #f3f3ec, text #54544d, default cursor, no hover change.
- The spinner is a 12px circle with a 1.5px currentColor border whose right side is transparent, rotating 360deg every 700ms linearly. The check is a 13px stroked path.
- Input and button use a 2px solid #667251 focus-visible outline at 3px offset. Under prefers-reduced-motion: reduce, remove transitions and stop the spinner's rotation.

DONE WHEN
- The button reads Saved at rest, Save after an edit, Saving for 900ms after a trigger, and Saved again when the stored value matches the field.
- Enter and Cmd or Ctrl+S save, unavailable triggers do nothing, focus stays on the button through every state, and the status region reports each change.
`;
