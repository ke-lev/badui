import {
  BUTTON_STYLING,
  ENVELOPE_BEHAVIOR,
  ENVELOPE_STYLING,
  READOUT_STYLING,
  SPECIMEN_STYLING,
  TAB_BEHAVIOR,
  TAB_STYLING,
} from "./common.prompt";

export const screamingBuddyPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named ScreamingBuddy. It takes no props and is used as <ScreamingBuddy />. It renders an area holding a one-field form (Name and Submit) and a red companion envelope that follows the pointer, wraps the field or button beneath it, and shows each one's name in capitals followed by a growing run of A's, shaking harder as the run grows. A readout below counts submissions. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area: a form holding a div with a label “Name” tied by htmlFor to a text input (name="name", autoComplete="off", id from useId), then a native type="submit" button labelled “Submit”; after the form, a layer div with aria-hidden="true" holding the envelope div and an empty tab div.
- The form's onSubmit calls preventDefault and increments the count.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Submitted” and a span with the integer count, starting at 0.
- The system pointer is not hidden, and the input and button work normally with pointer and keyboard.

BEHAVIOR
- Constants: an A is added every 70ms, starting with one and stopping at 18. Shake amplitude = 1.5 + 0.15 * count of A's, in pixels.
- State: real (pointer position in pixels from the area's top-left corner, or null), target (the input or button under the pointer, or null), since (a performance.now() timestamp), and the envelope.
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top). If real was null, place the envelope on its idle target around real and set since = performance.now(). On pointerover in the area, let el = event.target.closest("input, button"); if el differs from target, set target = el and since = performance.now(). On pointerleave, set real and target to null. Each event schedules a requestAnimationFrame callback if none is pending.
- Each frame, with dt = min((now - last) / 1000, 0.05):
  1. If real is null, remove the shown state from the envelope and tab and stop.
  2. If target is set, lock the envelope onto it; otherwise step it idle toward real.
  3. Let dwell = now - since and count = min(1 + floor(max(dwell, 0) / 70), 18). The tab text is the target's name in upper case, a space, and count A's; with no target it is only the A's. The input's name is its first label's text; the button's is its text.
  4. The jolt is (amplitude * sin(now * 0.09), amplitude * cos(now * 0.13)), or (0, 0) under prefers-reduced-motion (read once on mount). Add it to both the envelope's and the tab's translate.
  5. Show both the envelope and the tab, then schedule another frame.
${ENVELOPE_BEHAVIOR}
${TAB_BEHAVIOR}
- Remove all listeners and cancel any pending frame on unmount.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden.
- The form is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%), a flex row aligned to the bottom with an 8px gap.
- The label div is a flex column with a 4px gap, 11px text, color light-dark(#6b6b63, #9c9c91).
- The input is 140px wide, min-height 39px, padding 8px 10px, 1px solid light-dark(#85857b, #7a7a6d) border, 5px radius, background light-dark(#ffffff, #1a1a17), color light-dark(#282824, #e8e7e0), inherited font at 12px. Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset.
- The button is ${BUTTON_STYLING}. On hover its background is light-dark(#4d5142, #cdd1c2).
${ENVELOPE_STYLING}
- The envelope has a 2px solid light-dark(#c62a1f, #ff7e70) border and background light-dark(rgba(214, 40, 30, 0.14), rgba(238, 122, 111, 0.16)).
${TAB_STYLING}
- The tab has background light-dark(#b3261e, #ee7a6f), color light-dark(#fafaf6, #1a1a17), weight 700, letter-spacing 0.04em.
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button, envelope, and tab transitions.

DONE WHEN
- Entering the area shows a red circle trailing the pointer with a tab reading “A” that gains an A every 70ms up to eighteen.
- Over the input the envelope wraps it and reads “NAME A…”; over the button it reads “SUBMIT A…”; each move restarts the run at one A.
- The envelope and tab jitter with an amplitude that grows from 1.65px to 4.2px, and hold still under reduced motion.
- Typing a name and submitting by click or Enter increments Submitted.
`;
