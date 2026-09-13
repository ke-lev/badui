export const nearestTargetPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named NearestTarget. It takes no props and is used as <NearestTarget />. It renders a three-button playback control (previous, play or pause, next) whose buttons also answer to clicks near them: within 40 pixels, the nearest button is ringed, the pointer becomes a hand, and a click presses it. A status line shows the track and play state. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing an area div and a status paragraph below it.
- Inside the area, render a div with role="group" and aria-label="Playback" holding three native type="button" elements in order:
  1. aria-label="Previous track", icon: SVG viewBox "0 0 12 12", path d="M2 2h1.5v8H2zM10 2v8L4.5 6z".
  2. aria-label="Play" while paused and "Pause" while playing. Paused icon path d="M3.5 1.5v9L10 6z"; playing icon path d="M3 2h2v8H3zM7 2h2v8H7z".
  3. aria-label="Next track", icon path d="M8.5 2H10v8H8.5zM2 2v8l5.5-4z".
- Every icon SVG has aria-hidden="true" and fill currentColor.
- The status paragraph has role="status", aria-live="polite", and aria-atomic="true", containing a span “Track N of 5” and a span “Playing” or “Paused”.

BEHAVIOR
- State: track starts at 1 of TRACKS = 5; playing starts false; near starts at -1.
- Previous sets track to ((track - 1 - 1 + 5) % 5) + 1, wrapping from 1 to 5. Next sets ((track - 1 + 1 + 5) % 5) + 1, wrapping from 5 to 1. Play toggles playing.
- REACH = 40 pixels. On pointermove and pointerdown on the area, read each button's getBoundingClientRect(). For each, compute the gap from (clientX, clientY) to the rectangle: dx = max(|px - centreX| - halfWidth, 0), dy = max(|py - centreY| - halfHeight, 0), gap = hypot(dx, dy). A pointer inside a button has gap 0. near is the index with the smallest gap that is at most REACH; a strictly smaller gap is required to replace an earlier index, so ties go to the earlier button. If no gap is within reach, near is -1.
- On pointerleave from the area, set near to -1.
- Mark the button at index near with a data-near attribute and remove it from the others. While near is not -1, mark the area with a data-reach attribute.
- Listen for click on the area. If the click's target is inside a button, do nothing there; the button's own onClick has handled it. Otherwise, if near is not -1, call click() on the button at that index, which runs its normal handler exactly once.
- Keyboard: the three buttons are in normal tab order and activate natively with Enter and Space.
- Nothing about the mechanism depends on motion. Under prefers-reduced-motion, remove the buttons' transitions.
- Remove all listeners on unmount.

STYLING
- The specimen is a vertical flex column that grows to fill its container (flex: 1, align-self: stretch), 12px gap, min-width 0, color #282824.
- The area is position relative, a flex container centring its content both ways, flex 1, min-height 160px, touch-action manipulation. With data-reach its cursor is pointer.
- The group is a flex row, align-items center, gap 6px.
- Previous and next buttons: 32px by 32px, padding 0, content centred with CSS grid place-items center, 1px solid #deded6 border, 50% radius, background #fafaf6, color #282824, cursor pointer, transition background 120ms ease and box-shadow 120ms ease, touch-action manipulation. Icons are 12px by 12px.
- The play button: 40px by 40px, transparent border, background #30312b, color #fafaf6, otherwise the same.
- With data-near: box-shadow 0 0 0 5px rgba(102, 114, 81, 0.22) and background #eceee4; the play button's data-near background is #4d5142 instead.
- Focus-visible outline on any button is 2px solid #667251 with 3px offset.
- The status is a flex row with space-between, margin 0, 11px, color #6b6b63. The state span is #282824 in a monospace stack with tabular numerals.

DONE WHEN
- Hovering within 40px of the controls rings the nearest button and shows a hand pointer; beyond 40px nothing is ringed and the pointer is the default arrow.
- A click in the gap beside a button presses that button once; a click directly on a button presses it once, never twice.
- Previous and next wrap between tracks 1 and 5, Play and Pause swap label and icon, and the live status reflects both.
- All three buttons work from the keyboard with a visible focus outline.
`;
