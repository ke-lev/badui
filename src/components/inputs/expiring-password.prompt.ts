export const expiringPasswordPrompt = `WHAT TO BUILD
Build a portable React + TypeScript password field named ExpiringPassword. It takes no props and is used as <ExpiringPassword />. Keep the component, its lease helpers, and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a form. Inside it, in order: a heading row, the field, a lifetime receipt, a requirements list, a status paragraph, and one full-width button.
- The heading row holds a <label> reading "Create password", bound to the input by a useId-generated id, and a counter. The counter reads "Accepted" once the password is accepted, and otherwise the live character count and the 24 limit as "N/24".
- The field is a flex row holding the input and a reveal button. The input is type="text" at all times, never type="password"; while the password is hidden it carries a class that masks it in CSS, and revealing it removes that class. Give it maxLength 24, autoComplete "off", spellCheck false, autoCapitalize "none", autoCorrect "off", a placeholder of "Enter a password", and aria-describedby naming both the requirements list id and the status paragraph id.
- Keep the browser and its extensions out of the field: give the input no name attribute, and set data-1p-ignore, data-lpignore, data-bwignore and data-form-type="other" so password managers leave it alone. Because the input is not a native password field, a screen reader reads the typed characters aloud; state that in the component's own documentation.
- The reveal button is type="button" with aria-label="Show password" and aria-pressed reflecting the revealed state. It carries no text: its only content is a 16 by 16 aria-hidden SVG eye drawn in currentColor with 1.2 stroke width, round caps and joins, and no fill.
- While the password is hidden the eye is open: an almond outline and a radius 2 pupil at its centre. While the password is revealed the eye is closed: a single downward lid curve with three short lashes below it.
- The receipt is aria-hidden="true" throughout; it carries no text. It always renders exactly 24 bars, one per available position, whether or not a character occupies it.
- The requirements list is a <ul> carrying the described-by id, one <li> per requirement, each with a data-met attribute, an aria-hidden icon, and a visually hidden prefix reading "Met: " or "Not met: " before the label.
- The icon is a 12 by 12 SVG: a check path when met, an outlined circle when not.
- The status paragraph carries role="status" and the described-by id.
- The final control is a submit button reading "Create password", disabled until every requirement is met. Once the password is accepted, replace it with a type="button" control reading "Start again".

BEHAVIOR
- Every character carries its own deadline. A character expires 8000ms after it was typed, independently of its neighbours.
- Hold the password as a list of entries, each a character and an expiry timestamp. The field's value is those characters joined.
- On edit, first strip every character outside printable ASCII, code points 33 through 126 inclusive, then truncate to 24 characters.
- An edit preserves the deadlines of the unchanged prefix and the unchanged suffix, and gives only the characters between them a fresh deadline of the current time plus 8000ms. Compare the previous list and the new value from the front to find the shared prefix, then from the back to find the shared suffix. An edit in the middle therefore never renews the text around it, and retyping a character that already existed starts that character's lifetime over.
- Expiry drops every entry whose deadline is at or before the current time. It also maps a caret offset forward by counting how many of the entries before that offset survived.
- Run an interval every 100ms. Skip the tick while an IME composition is active or while the password is empty. Otherwise read the current time, compute the surviving entries, and store the time so the bars advance.
- When a tick removes nothing, update only the stored time. When it removes at least one character and the input is the active element, map both the selection start and the selection end through expiry and restore that range in a layout effect after the update, so the caret keeps its place in the surviving text.
- Expiry never writes to the status; the bars and the counter carry it.
- The initial status, and the status after any ordinary edit, is empty.
- If an edit supplied any character outside the printable ASCII range, set the status to "Use letters, numbers and symbols without spaces." instead.
- The three requirements are "8–24 characters", met when the length is at least 8 and at most 24; "Upper & lowercase", met when the value contains both an uppercase and a lowercase letter; and "Number & symbol", met when it contains a digit and a character that is neither a letter nor a digit. They are always evaluated against what currently survives.
- On submit, prevent the default, and do nothing when already accepted or while composing. Expire the entries once more against the current time, then re-check the requirements against what remains.
- If that check fails, set the status to "The remaining characters do not meet all requirements." and stop; the password is not accepted.
- If it passes, clear the field, mark the password accepted, and set the status to "Password accepted. Nothing was stored."
- Acceptance stops the interval, makes the input readOnly, changes its placeholder to "Password accepted", disables the reveal button, and shows every requirement as met regardless of the now-empty value.
- "Start again" clears the entries, leaves the accepted state, hides the password, empties the status, and focuses the input.
- Each bar shows one position's remaining fraction, the time left divided by 8000, clamped at zero, as a vertical scale growing from the bottom. An empty position is zero. Mark a bar urgent when its fraction is above 0 and at or below 0.25.
- Nothing is stored, persisted, or sent anywhere.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The form is width 100%, max-width 340px, centered by auto inline margins, 12px type, color light-dark(#282824, #e8e7e0).
- The heading row is a flex row, centered, space-between, 12px gap, with 10px of bottom margin.
- The counter is 11px, color light-dark(#6b6b63, #9c9c91), with tabular numerals.
- The field is a 46px flex row with a 1px solid light-dark(#a9aa9f, #62635a) border, 4px radius, light-dark(#ffffff, #1a1a17) background, and a 2px light-dark(#667251, #8e9c78) outline at 3px offset on focus-within.
- The input fills the row, padding 0 12px, no border, 4px radius, transparent background, 16px type, color light-dark(#282824, #e8e7e0), caret light-dark(#4e6145, #a9b894), and no outline of its own. Its placeholder is light-dark(#6b6b63, #9c9c91).
- The reveal button does not flex, 46px wide with its glyph centred by a grid, 3px of right margin, no border, 3px radius, transparent background, color light-dark(#45453f, #c3c3b9); it takes a light-dark(#f1f1ea, #262622) background on hover when enabled, and the same focus outline as the submit control.
- The receipt sits 56px below the field. The bars are a 24-column grid of equal minmax(0, 1fr) tracks with 3px gaps.
- A bar is position relative, 36px tall, hidden overflow, 1px radius, light-dark(#deded6, #34342f) background. Its fill is absolutely inset, light-dark(#4e6145, #a9b894), with a bottom transform origin and a 100ms linear transform transition. An urgent bar fills light-dark(#b3261e, #ee7a6f).
- The masking class sets -webkit-text-security: disc, with the unprefixed text-security: disc beside it.
- The requirements list is a 5px grid with no marker, margin 14px 0 0, no padding, color light-dark(#6b6b63, #9c9c91). Each item is a centered flex row with an 8px gap and an icon that does not flex. A met item is light-dark(#4e6145, #a9b894).
- The status is 11px type, 18px line-height, color light-dark(#6b6b63, #9c9c91), min-height 18px, margin 12px 0 10px. While it is empty it takes no height: min-height 0 and margin 0 0 10px.
- The final button is full width, min-height 42px, padding 8px 12px, a 1px transparent border, 4px radius, light-dark(#30312b, #e8e7e0) background, light-dark(#fafaf6, #1a1a17) text, 12px type; it darkens to light-dark(#4d5142, #cdd1c2) on hover when enabled. Disabled it is light-dark(#f1f1ec, #262622) with light-dark(#6b6b63, #9c9c91) text and a light-dark(#deded6, #34342f) border.
- The visually hidden prefix is 1px square, absolutely positioned, no padding, hidden overflow, clip-path inset(50%), no wrapping.
- Remove the bar transition under reduced motion.

DONE WHEN
- Each character disappears 8 seconds after it was typed, independently of the others, and the counter, bars and requirements follow what survives.
- Editing the middle of the password leaves the deadlines of the text around it untouched.
- The caret stays where it was in the surviving text when characters expire while the field is focused.
- Submitting re-checks the deadlines, refuses a password whose survivors fall short, and on success clears the field and reports that nothing was stored.
- Roles, labels, the described-by wiring, and the status region match the specification, and the receipt stays hidden from assistive technology.
`;
