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
Build a portable React + TypeScript component named OpinionatedBuddy. It takes no props and is used as <OpinionatedBuddy />. It renders an area that hides the system pointer and draws its own, a row of two buttons (Unsubscribe, Cancel), and a companion envelope that, near either button, wraps Cancel. Near Unsubscribe the drawn pointer is shifted into Cancel, and it never lands on or crosses Unsubscribe. A readout below names the last button pressed. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area, in this order: a div with role="group" and aria-label="Subscription actions" holding two native type="button" elements labelled “Unsubscribe” and “Cancel” as their text, in that order; a layer div with aria-hidden="true" holding the envelope div and a tab div whose text is “This one.”; the drawn pointer.
${ARROW_MARKUP}
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Last pressed” and a span with the name of the last button pressed, or “None” before any.
- Each button keeps native focus and keyboard activation. Its onClick handler records its own name as last pressed.

BEHAVIOR
- Constants: REACH = 40px; INSET = 6px; shift spring STIFFNESS = 120 with ratio 1.
- ${SPRING}
- State: real (pointer position in pixels from the area's top-left corner, or null), shift springs sx and sy starting at 0, and the envelope.
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top); if real was null, place the envelope on its idle target around real. On pointerleave set real = null and set both shift springs to 0 with zero velocity. Each event schedules a requestAnimationFrame callback if none is pending.
- Each frame, with dt = min((now - last) / 1000, 0.05):
  1. Read the two buttons' getBoundingClientRect() boxes and convert them to area coordinates (subtract the area rect's left and top): U for Unsubscribe, C for Cancel.
  2. If real is not null, test the zone: U grown by 40px on every side. If real is inside the zone (edges inclusive), let tx = (real.x - zone.left) / zone.width and ty = (real.y - zone.top) / zone.height, and let inset = min(6, C.width / 2, C.height / 2). The target is (C.left + inset + tx * (C.width - 2 * inset), C.top + inset + ty * (C.height - 2 * inset)), so every point in the zone maps to the matching spot inside Cancel. The shift goal is target - real. Outside the zone, or when real is null, the goal is (0, 0).
  3. Locked is true when real is inside the zone, or when real is within 40px of either button: for each box, the distance to its edge is hypot(max(|px - cx| - halfWidth, 0), max(|py - cy| - halfHeight, 0)).
  4. Advance sx and sy toward the goal; under prefers-reduced-motion (read once on mount) set them to it directly. The drawn position is real + (sx, sy), or null when real is null. If the drawn position is inside U (edges inclusive), set sx and sy to the goal with zero velocity and recompute the drawn position, so the drawn pointer is never inside Unsubscribe. When the drawn position is null set the pointer div's visibility to hidden; otherwise visible with transform translate3d(x px, y px, 0).
  5. The hovered button is the first whose client box contains the drawn position, edges inclusive. Set a data-hover attribute on it and remove it from the others.
  6. If locked, lock the envelope onto Cancel; otherwise, if the drawn position exists, step it idle toward the drawn position. Show the envelope while the drawn position exists. Show the tab only while locked.
  7. Schedule another frame while real is not null. When real is null, paint hidden and stop.
${ENVELOPE_BEHAVIOR}
${TAB_BEHAVIOR}
- The buttons have pointer-events: none, so the real pointer never hovers, presses, or clicks them.
- Listen for click on the area. If the event's target is a button (keyboard activation), do nothing there. Otherwise, if a button is hovered by the drawn position, call that button's click().
- Remove all listeners and cancel any pending frame on unmount.

- Read the reduced-motion preference where it is used rather than capturing it when the component mounts, so changing the preference while the page is open takes effect on the next frame.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden and cursor none.
- The group is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%), a flex row with an 8px gap.
- Each button is ${BUTTON_STYLING}. With data-hover its background is light-dark(#4d5142, #cdd1c2).
- Unsubscribe instead has background light-dark(#b3261e, #ee7a6f) and text light-dark(#fafaf6, #1a1a17); with data-hover its background is light-dark(#8f1e18, #f29a90).
${ARROW_STYLING}
${ENVELOPE_STYLING}
- The envelope has a 1.5px solid light-dark(#4e6145, #a9b894) border and background light-dark(rgba(137, 145, 118, 0.09), rgba(113, 123, 95, 0.09)).
${TAB_STYLING}
- The tab has background light-dark(#282824, #e8e7e0) and color light-dark(#fbfaf8, #161614).
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button, envelope, and tab transitions.

DONE WHEN
- Bringing the pointer within 40px of Unsubscribe, from any side, wraps Cancel, shows “This one.”, and slides the drawn arrow into Cancel; a click there records Cancel.
- Moving the real pointer anywhere over or around Unsubscribe keeps the drawn arrow inside Cancel, and the drawn arrow is never over Unsubscribe, even mid-slide.
- Near Cancel alone, Cancel is wrapped and the arrow stays at the real position.
- Away from both, the arrow returns to the real position and the envelope trails it as a small circle.
- Keyboard activation records the focused button exactly once.
`;
