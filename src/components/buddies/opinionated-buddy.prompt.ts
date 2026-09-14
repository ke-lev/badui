import {
  ARROW_MARKUP,
  ARROW_STYLING,
  BUTTON_STYLING,
  ENVELOPE_BEHAVIOR,
  ENVELOPE_STYLING,
  READOUT_STYLING,
  SPECIMEN_STYLING,
  SPRING,
  TAB_BEHAVIOR,
  TAB_STYLING,
} from "./common.prompt";

export const opinionatedBuddyPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named OpinionatedBuddy. It takes no props and is used as <OpinionatedBuddy />. It renders an area that hides the system pointer and draws its own, a row of three buttons (Keep, Archive, Delete), and a companion envelope that, near any button, wraps the next button along and shifts the drawn pointer onto it. A readout below names the last button pressed. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area, in this order: a div with role="group" and aria-label="Message actions" holding three native type="button" elements labelled “Keep”, “Archive”, and “Delete” as their text; a layer div with aria-hidden="true" holding the envelope div and a tab div whose text is “This one.”; the drawn pointer.
${ARROW_MARKUP}
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Last pressed” and a span with the name of the last button pressed, or “None” before any.
- Each button keeps native focus and keyboard activation. Its onClick handler records its own name as last pressed.

BEHAVIOR
- Constants: REACH = 40px; shift spring STIFFNESS = 120 with ratio 1.
- ${SPRING}
- State: real (pointer position in pixels from the area's top-left corner, or null), shift springs sx and sy starting at 0, and the envelope.
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top); if real was null, place the envelope on its idle target around real. On pointerleave set real = null and set both shift springs to 0 with zero velocity. Each event schedules a requestAnimationFrame callback if none is pending.
- Each frame, with dt = min((now - last) / 1000, 0.05):
  1. Read the three buttons' getBoundingClientRect() boxes.
  2. If real is not null, find the nearest button to real in client coordinates: for each box, the distance to its edge is hypot(max(|px - cx| - halfWidth, 0), max(|py - cy| - halfHeight, 0)). The nearest is the smallest distance that is at most 40; ties go to the earlier button. If there is one, the preferred button is (nearest + 1) mod 3, so Keep prefers Archive, Archive prefers Delete, and Delete prefers Keep.
  3. The shift target is the preferred button's centre minus the nearest button's centre, or (0, 0) when nothing is preferred. Advance sx and sy toward it; under prefers-reduced-motion (read once on mount) set them to it directly.
  4. The drawn position is real + (sx, sy), or null when real is null. When it is null set the pointer div's visibility to hidden; otherwise visible with transform translate3d(x px, y px, 0).
  5. The hovered button is the first whose client box contains the drawn position, edges inclusive. Set a data-hover attribute on it and remove it from the others.
  6. If a button is preferred, lock the envelope onto the preferred button; otherwise, if the drawn position exists, step it idle toward the drawn position. Show the envelope while the drawn position exists. Show the tab only while locked.
  7. Schedule another frame while real is not null. When real is null, paint hidden and stop.
${ENVELOPE_BEHAVIOR}
${TAB_BEHAVIOR}
- The buttons have pointer-events: none, so the real pointer never hovers, presses, or clicks them.
- Listen for click on the area. If the event's target is a button (keyboard activation), do nothing there. Otherwise, if a button is hovered by the drawn position, call that button's click().
- Remove all listeners and cancel any pending frame on unmount.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden and cursor none.
- The group is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%), a flex row with an 8px gap.
- Each button is ${BUTTON_STYLING}. With data-hover its background is light-dark(#4d5142, #cdd1c2).
${ARROW_STYLING}
${ENVELOPE_STYLING}
- The envelope has a 1.5px solid light-dark(#4e6145, #a9b894) border and background light-dark(rgba(137, 145, 118, 0.09), rgba(113, 123, 95, 0.09)).
${TAB_STYLING}
- The tab has background light-dark(#282824, #e8e7e0) and color light-dark(#fbfaf8, #161614).
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button, envelope, and tab transitions.

DONE WHEN
- Bringing the pointer within 40px of Keep wraps Archive, shows “This one.”, and slides the drawn arrow onto Archive; a click there records Archive.
- Near Delete, the arrow is carried back to Keep.
- Away from all three, the arrow returns to the real position and the envelope trails it as a small circle.
- Keyboard activation records the focused button exactly once.
`;
