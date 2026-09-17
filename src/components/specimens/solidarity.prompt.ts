export const solidarityPrompt = `WHAT TO BUILD
Build a portable React + TypeScript linked preference group named Solidarity. It takes no props and is used as <Solidarity />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a fieldset with legend “Select your preferences”.
- Render three controlled native checkbox inputs inside clickable labels, in this order: “Good”, “Cheap”, “Fast”. Each input has an aria-hidden custom checkbox visual followed by its visible label.
- Beneath the fieldset, show “N selected” in role="status" beside a type="button" labeled “Save preferences”.
- After saving, replace the editor with a role="status" success panel containing a decorative check, “Preferences saved.”, “N preferences selected.”, and an “Edit preferences” button.

BEHAVIOR
- Initial checked values are exactly [true, false, true], so the initial count is 2.
- Toggling checkbox index i flips both index i and index (i + 1) modulo 3 in one state update.
- Toggling the third checkbox therefore also toggles the first.
- Derive the displayed count from the current number of true values.
- Saving changes only the saved view state and preserves all checkbox values. Editing returns to the same values without resetting them.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The editor is width 100%, max-width 296px, color light-dark(#282824, #e8e7e0). The fieldset has no margin, padding, or border; the legend is 13px medium type.
- Put the option list 17px below the legend with a 1px solid light-dark(#deded6, #34342f) top border. Each label is a position-relative flex row, min-height 50px, 12px gap, 13px type, with the same bottom border and pointer cursor.
- Keep each real checkbox native and focusable but visually hide it by positioning it at left 0, width and height 19px, margin 0, opacity 0, z-index 1.
- The custom box is 19px square, flex-shrink 0, 1px solid light-dark(#868b7c, #a0a892) border, 3px radius, light-dark(#ffffff, #1a1a17) background, with a centered decorative check. When checked use border light-dark(#767f63, #97a37f), background light-dark(#e6eada, #2b3125), and check color light-dark(#586245, #a9b894). Hover border is light-dark(#858b75, #717b5f). Input focus-visible gives the custom box a 2px solid light-dark(#667251, #8e9c78) outline at 3px offset.
- Place actions in a flex row spaced apart with 12px gap and 22px top margin. The count is 10px sans-serif, light-dark(#6b6b63, #9c9c91), nowrap.
- The save button is min-height 39px, padding 8px 15px, 5px radius, background light-dark(#30312b, #e8e7e0), text light-dark(#fafaf6, #1a1a17), 12px medium type; hover light-dark(#4d5142, #cdd1c2), active translateY(1px), focus-visible 2px light-dark(#667251, #8e9c78) outline at 3px offset.
- The success panel is width 100%, centered, vertical with 18px gap. Its circular check is 36px with border light-dark(#d8decc, #3a4231), background light-dark(#eef1e5, #2b3125), color light-dark(#606c4f, #8e9c78). Title is 18px medium with -0.5px tracking; description is 12px light-dark(#6b6b63, #9c9c91) with margin -9px 0 0. Edit is a light-dark(#ffffff, #1a1a17) secondary button with light-dark(#ddddd5, #34342f) border and light-dark(#464640, #c3c3b9) text.
- Checkbox and button transitions run 120ms and 150ms ease respectively and are removed under reduced motion.

DONE WHEN
- Each native checkbox reports its own checked state while every user toggle changes exactly it and its wrapped successor.
- Save preserves values and reports the current count; Edit restores the editor without resetting.
- Fieldset structure, live status, focus treatment, custom checkmarks, action row, and success panel match the specification.
`;
