import { ARROW_MARKUP, ARROW_STYLING, BUTTON_STYLING, READOUT_STYLING, SPECIMEN_STYLING, SPRING } from "./common.prompt";

export const hungryBuddyPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named HungryBuddy. It takes no props and is used as <HungryBuddy />. It renders an area that hides the system pointer and draws its own, a centred Continue button, and a round companion that follows the pointer slowly and swallows it on contact. A readout below counts presses and meals. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing the area (a position-relative div) and a readout paragraph below it.
- Inside the area, in this order: one native type="button" labelled “Continue” as its text content; the drawn pointer; the companion, a div with aria-hidden="true" containing a face span that holds three empty spans, in order: a left eye, a right eye, and a mouth.
${ARROW_MARKUP}
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing two spans: “Presses ” followed by a count span, and “Eaten ” followed by a count span. Both counts start at 0.
- The button keeps native focus and keyboard activation. Its onClick handler increments Presses, so Tab then Enter or Space presses it.

BEHAVIOR
- Constants: STIFFNESS = 9 with damping ratio 1 (damping 6); START centre (28, 28); SIZE = 24, fixed; EAT = 1400ms; REST = 800ms; CHEWS = 3 per meal; OPEN_SHARE = 0.6.
- ${SPRING}
- State: real (pointer position in pixels from the area's top-left corner, or null), springs x and y starting at START, meals, phase ("hunting", "eating", or "resting"), and since (the time the phase began).
- On pointermove and pointerdown on the area, set real = (clientX - areaRect.left, clientY - areaRect.top). On pointerleave set real = null. Each event schedules a requestAnimationFrame callback if none is pending. Schedule one frame on mount as well, so the companion paints at its start.
- Each frame, with now as the frame timestamp and dt = min((now - last) / 1000, 0.05), in this order:
  1. If phase is eating and now - since >= 1400, set phase to resting and since to now.
  2. If phase is resting and now - since >= 800, set phase to hunting.
  3. If phase is hunting and real is not null, advance x and y toward real. Then, if the distance from (x, y) to real is at most SIZE / 4 (6px), set phase to eating, since to now, and increment meals. The companion's size never changes.
- The drawn pointer position is null while eating, otherwise real. When it is null set the pointer div's visibility to hidden; otherwise set it visible with transform translate3d(x px, y px, 0).
- Set a data-hover attribute on the button when the drawn position, converted to client coordinates, lies within the button's getBoundingClientRect() edges inclusive; remove it otherwise.
- Paint the companion: transform translate3d(x - 12 px, y - 12 px, 0). Set a data-eating attribute while eating. The companion itself never scales.
- Chew while eating. Record mealStart = now on the first frame of each meal, and let t = now - mealStart. Let cycle = 1400 / 3 ms and p = (t mod cycle) / cycle. The jaw's openness is open = (1 - cos(π * p / 0.6)) / 2 when p < 0.6, and open = 1 - ((p - 0.6) / 0.4)² otherwise: it eases open, then accelerates shut, and each meal ends shut after exactly three chews. The jaw's sway is side = sin(2π * p). Each frame while eating, set the mouth's inline width to 7 * (1 - 0.1 * open) px, its height to 3 + 3.5 * open px, and its transform to translate(-50%, -50%) translateX(0.8 * side px). Under prefers-reduced-motion (read once on mount), use open = 1 and side = 0 for the whole meal. On the first frame after a meal, clear the mouth's inline width, height, and transform. When meals changes, update the Eaten count.
- Aim the face each frame, using the drawn pointer position. When it is null, or equals (x, y), set the face span's transform to translate3d(0px, 0px, 0). Otherwise let dx = pointerX - x, dy = pointerY - y, distance = √(dx² + dy²), and offset = min(distance / 24, 1) * 2.4; set the face span's transform to translate3d(dx / distance * offset px, dy / distance * offset px, 0). The eyes and mouth travel together, at most 2.4px, reaching that once the pointer is 24px away.
- Each frame, set a data-angry attribute on the companion when the drawn pointer position is not null and its distance to (x, y) is at most 48px (two diameters); remove it otherwise.
- Schedule another frame while phase is not hunting or real is not null. The companion does not move while the pointer is outside the area.
- The button has pointer-events: none, so the real pointer never hovers, presses, or clicks it.
- Listen for click on the area. If the event's target is the button itself (keyboard activation), do nothing there. Otherwise, if the drawn position from the latest frame lies within the button's bounds, increment Presses. A click while the pointer is eaten does nothing.
- Remove all listeners and cancel any pending frame on unmount.

- Read the reduced-motion preference where it is used rather than capturing it when the component mounts, so changing the preference while the page is open takes effect on the next frame.

STYLING
${SPECIMEN_STYLING}
- The area also has overflow hidden and cursor none.
- The button is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%); ${BUTTON_STYLING}. With data-hover its background is light-dark(#4d5142, #cdd1c2).
${ARROW_STYLING}
- The companion is absolutely positioned at top 0, left 0; 24px square; border-radius 50%; 1.5px solid light-dark(#4e6145, #a9b894) border; background light-dark(rgba(137, 145, 118, 0.16), rgba(113, 123, 95, 0.16)); transform translate3d(16px, 16px, 0) before the first frame; transform-origin center; pointer-events none; will-change transform; its size never changes. With data-eating its background is light-dark(rgba(78, 97, 69, 0.55), rgba(169, 184, 148, 0.55)). It paints above the drawn pointer.
- The face is sized in percentages of the companion. The face span is absolutely positioned with inset 0 and will-change transform. Each eye is absolutely positioned at top 26%, 14% wide and 22% tall, border-radius 999px, background light-dark(#282824, #e8e7e0); the left eye at left 26%, the right eye at right 26%. The mouth is absolutely positioned at top 56%, left 50%, transform translateX(-50%); 34% wide and 14% tall; border-bottom 1.5px solid light-dark(#282824, #e8e7e0); border-radius 0 0 50% 50% / 0 0 100% 100%, drawing a shallow smile.
- With data-angry on the companion, the eyes slant down toward the middle and the mouth is unchanged: the left eye has clip-path polygon(0 0, 100% 45%, 100% 100%, 0 100%), and the right eye has clip-path polygon(0 45%, 100% 0, 100% 100%, 0 100%).
- With data-eating on the companion, each eye becomes a shallow upward arc on the same centre, the smile inverted: top 31%, 22% wide, 12% tall, border-top 1.5px solid light-dark(#282824, #e8e7e0), border-radius 50% 50% 0 0 / 100% 100% 0 0, no background, clip-path none; the left eye at left 22%, the right eye at right 22%. Sizes are border-box. The mouth becomes a hollow ellipse centred on one line: top 62%, width 7px, height 3px, border 1.5px solid light-dark(#282824, #e8e7e0) on all sides, border-radius 999px, no background, transform translate(-50%, -50%). Sizes are border-box, so when shut its two strokes meet in a single line. The chewing sets its width, height, and transform inline over these. The switch into and out of the eating and angry faces is immediate, with no transition.
${READOUT_STYLING}
- Under prefers-reduced-motion, remove the button's background transition.

DONE WHEN
- Holding the pointer still inside the area brings the companion onto it within about two seconds; the arrow disappears, the companion chews three times with its mouth easing open, biting shut, and swaying side to side, and darkens for 1.4 seconds, the arrow returns, and Eaten reads 1.
- The eyes slant inward once the companion is within 48px of the arrow, while the smile stays; they become upward arcs, the smile inverted, for the whole meal.
- After another 0.8 seconds a still pointer is swallowed again at once; the companion stays 24px throughout.
- The eyes and mouth lean together toward the arrow as it moves around the companion, and sit centred while it is eaten or outside the area.
- A click counts only while the arrow is visible and over the button; keyboard activation counts exactly once.
`;
