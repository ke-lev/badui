export const passwordFieldPrompt = `WHAT TO BUILD
Build a portable React + TypeScript staged password form named PasswordField. It takes no props and is used as <PasswordField />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a noValidate form with a useId-connected label reading “Create a password”.
- Use a controlled input named “password”, type password or text according to reveal state, autocomplete off, spellcheck false, and placeholder “Enter password”. Connect it with aria-describedby to the requirements list and set aria-invalid=true only after a submit attempt.
- Add a type="button" reveal control showing “Show” or “Hide”, with the matching aria-label and aria-pressed state.
- Render requirements as a ul with aria-live="polite". Every item has a decorative status mark plus screen-reader-only text “: met” or “: not met”.
- The submit button reads “Create password”. The accepted view is a role="status" success panel with a decorative check, “Password accepted.”, and a “Start again” button.

BEHAVIOR
- Start with password empty, hidden, stage 0, submitted false, and accepted false.
- Always show “At least 8 characters” and “At least one number”. Count numbers with the regular expression /\\d/g.
- On every edit, clear submitted. If the value has at least 8 characters and at least one number, advance the persistent stage to at least 1; when the current value has exactly 3 numbers, advance it to stage 2. Stage never decreases during editing.
- At stage 1, additionally show “Exactly 3 numbers”. At stage 2, additionally show “No vowels. Including y.”, met only when /[aeiouy]/i finds no match.
- On submit, prevent default and set submitted true. Accept only when stage is exactly 2 and all four currently rendered requirements are met. Otherwise focus the password input.
- When accepted, replace the form with the success panel and focus “Start again”. Activating it clears all state to the initial values; when the form returns after a prior acceptance, focus the password input.

STYLING
- The form is width 100%, max-width 296px, color #282824. Use 13px medium type for the label.
- The input shell is a 45px-high flex row with 9px top margin, 1px solid #868b7c border, 5px radius, #ffffff background, and hidden overflow. On focus-within use border #757b64 and a 3px 11%-opacity #757b64 ring; after submit use border #9a733e.
- The input fills the shell with 12px horizontal padding, no border or outline, transparent background, and 14px inherited type. Placeholder is #75756b. The reveal control stretches vertically, min-width 53px, no border, transparent background, 11px monospace, color #64645d; hover is #282824 on #f5f5ef and focus is a 2px #667251 inset outline at -4px offset.
- The requirement list reserves min-height 100px, margin 15px 0 13px, no padding or bullets, color #6b6b63. Rows are min-height 24px, 12px type, 7px gap. Met rows are #606c4f; submitted unmet rows are #8c6026. Status marks occupy 16px square; unmet uses a 5px circular outline.
- The primary button fills the form width, min-height 39px, padding 8px 15px, 5px radius, background #30312b, text #fafaf6, 12px medium type; hover background #4d5142 and active translateY(1px). Focus-visible outline is 2px solid #667251 at 3px offset.
- Center the success panel vertically with an 18px gap. Its icon is 36px circular with border #d8decc, background #eef1e5, color #606c4f. Title is 18px medium with -0.5px tracking. The restart button is white with border #ddddd5, #464640 text, and the same size and focus treatment as the primary button.
- At widths up to 600px, make the input font 16px. Remove transitions under reduced motion.

DONE WHEN
- Requirements appear in stages and never disappear merely because the current text stops meeting an earlier stage trigger.
- Acceptance requires at least 8 characters, exactly 3 digits, and no a, e, i, o, u, or y in either case.
- Rejection, acceptance, reset focus, live requirement status, reveal state, and visible styling match the specification.
`;
