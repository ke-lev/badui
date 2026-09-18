import {
  BUTTON_STYLING,
  ENVELOPE_BEHAVIOR,
  ENVELOPE_STYLING,
  READOUT_STYLING,
  SPECIMEN_STYLING,
  SPRING,
} from "./common.prompt";

export const clingyBuddyPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named ClingyBuddy. It takes no props and is used as <ClingyBuddy />. It renders an area holding two buttons, Stay and Leave, and a companion envelope that takes hold of whichever button the pointer enters and pulls it along behind the pointer until the pointer is more than 200px from the button's resting place. A readout below counts presses of each. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area, in this order: a native type="button" labelled “Stay”; a native type="button" labelled “Leave”; a layer div with aria-hidden="true" holding the envelope div.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing two spans: “Stay ” followed by a count span, and “Leave ” followed by a count span. Both start at 0 and each button's onClick increments its own.
- The system pointer is not hidden. Both buttons keep native pointer, focus, and keyboard behavior.

BEHAVIOR
- Constants: PULL = 0.85; BREAK = 200px; hold spring stiffness 600 with ratio 1; return spring stiffness 170 with ratio 0.35.
- ${SPRING}
- State: real (pointer position in pixels from the area's top-left corner, or null), held (the index of the held button, or -1), an offset spring pair (x, y) per button starting at 0, and the envelope.
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top); if real was null, place the envelope on its idle target around real. On pointerover in the area, if event.target.closest("button") is one of the two buttons and held is -1, set held to its index. On pointerleave set real = null and held = -1. Each event schedules a requestAnimationFrame callback if none is pending.
- Each frame, with dt = min((now - last) / 1000, 0.05), for each button:
  1. Read its getBoundingClientRect(). Its home centre, relative to the area, is the rect's centre minus the area's top-left minus its current offset.
  2. Its offset target is (0, 0), except for the held button while real is set: let d = real - home. If hypot(d) is more than 200, set held to -1 and keep the target at (0, 0). Otherwise the target is d * 0.85.
  3. Advance the offset toward its target with the hold spring if the button is still held, otherwise the return spring. Under prefers-reduced-motion (read once on mount) set it to the target directly.
  4. Set the button's transform to translate(-50%, -50%) translate3d(offsetX px, offsetY px, 0).
- Then, if real is set: if a button is held, lock the envelope onto that button's box at its new offset; otherwise step it idle toward real. Show the envelope while real is set.
- Schedule another frame while real is set or any offset has not settled exactly on its target.
${ENVELOPE_BEHAVIOR}
- Only one button is held at a time. A button is only taken hold of when the pointer enters it.
- Remove all listeners and cancel any pending frame on unmount.

- Read the reduced-motion preference where it is used rather than capturing it when the component mounts, so changing the preference while the page is open takes effect on the next frame.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden.
- Each button is absolutely positioned at top 50% with transform translate(-50%, -50%) before the first frame; Stay at left 30% and Leave at left 70%. Each is ${BUTTON_STYLING}. On hover its background is light-dark(#4d5142, #cdd1c2).
${ENVELOPE_STYLING}
- The envelope has a 1.5px solid light-dark(#4e6145, #a9b894) border and background light-dark(rgba(137, 145, 118, 0.09), rgba(113, 123, 95, 0.09)).
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button and envelope transitions.

DONE WHEN
- Entering Stay wraps it; moving away drags it after the pointer, 85% of the distance from its home.
- Past 200px from its home it lets go and swings back with a visible overshoot before resting at home; under reduced motion it returns at once.
- While Stay is held, Leave is not taken hold of, and a click lands on whichever button is actually under the pointer.
- Keyboard activation of either button counts exactly once.
`;
