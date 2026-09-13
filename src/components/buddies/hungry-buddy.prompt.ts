import { ARROW_MARKUP, ARROW_STYLING, BUTTON_STYLING, READOUT_STYLING, SPECIMEN_STYLING, SPRING } from "./common.prompt";

export const hungryBuddyPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named HungryBuddy. It takes no props and is used as <HungryBuddy />. It renders an area that hides the system pointer and draws its own, a centred Continue button, and a round companion that follows the pointer slowly and swallows it on contact. A readout below counts presses and meals. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area, in this order: one native type="button" labelled “Continue” as its text content; the drawn pointer; the companion, an empty div with aria-hidden="true".
${ARROW_MARKUP}
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing two spans: “Presses ” followed by a count span, and “Eaten ” followed by a count span. Both counts start at 0.
- The button keeps native focus and keyboard activation. Its onClick handler increments Presses, so Tab then Enter or Space presses it.

BEHAVIOR
- Constants: STIFFNESS = 9 with damping ratio 1 (damping 6); START centre (28, 28); SIZE starts at 24 and grows by 6 per meal to at most 72; EAT = 1400ms; REST = 800ms; chewing pulse amplitude 0.08 at 4 Hz.
- ${SPRING}
- State: real (pointer position in pixels from the area's top-left corner, or null), springs x and y starting at START, size, meals, phase ("hunting", "eating", or "resting"), and since (the time the phase began).
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top). On pointerleave set real = null. Each event schedules a requestAnimationFrame callback if none is pending. Schedule one frame on mount as well, so the companion paints at its start.
- Each frame, with now as the frame timestamp and dt = min((now - last) / 1000, 0.05), in this order:
  1. If phase is eating and now - since >= 1400, set phase to resting and since to now.
  2. If phase is resting and now - since >= 800, set phase to hunting.
  3. If phase is hunting and real is not null, advance x and y toward real. Then, if the distance from (x, y) to real is at most size / 4, set phase to eating, since to now, increment meals, and set size = min(size + 6, 72).
- The drawn pointer position is null while eating, otherwise real. When it is null set the pointer div's visibility to hidden; otherwise set it visible with transform translate3d(x px, y px, 0).
- Set a data-hover attribute on the button when the drawn position, converted to client coordinates, lies within the button's getBoundingClientRect() edges inclusive; remove it otherwise.
- Paint the companion: width and height = size; transform translate3d(x - size / 2 px, y - size / 2 px, 0) scale(s), where s = 1 + 0.08 * sin(2π * 4 * now / 1000) while eating, and 1 otherwise or under prefers-reduced-motion (read once on mount). Set a data-eating attribute while eating. When meals changes, update the Eaten count.
- Schedule another frame while phase is not hunting or real is not null. The companion does not move while the pointer is outside the area.
- The button has pointer-events: none, so the real pointer never hovers, presses, or clicks it.
- Listen for click on the area. If the event's target is the button itself (keyboard activation), do nothing there. Otherwise, if the drawn position from the latest frame lies within the button's bounds, increment Presses. A click while the pointer is eaten does nothing.
- Remove all listeners and cancel any pending frame on unmount.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden and cursor none.
- The button is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%); ${BUTTON_STYLING}. With data-hover its background is #4d5142.
${ARROW_STYLING}
- The companion is absolutely positioned at top 0, left 0; 24px square; border-radius 50%; 1.5px solid #4e6145 border; background rgba(137, 145, 118, 0.16); transform translate3d(16px, 16px, 0) before the first frame; transform-origin center; pointer-events none; will-change transform. With data-eating its background is rgba(78, 97, 69, 0.55). It paints above the drawn pointer.
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button's background transition.

DONE WHEN
- Holding the pointer still inside the area brings the companion onto it within about two seconds; the arrow disappears, the companion pulses and darkens for 1.4 seconds, the arrow returns, and Eaten reads 1.
- After another 0.8 seconds a still pointer is swallowed again at once; the companion stops growing at 72px.
- A click counts only while the arrow is visible and over the button; keyboard activation counts exactly once.
`;
