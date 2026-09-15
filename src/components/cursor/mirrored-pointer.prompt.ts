export const mirroredPointerPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named MirroredPointer. It takes no props and is used as <MirroredPointer />. It renders an area that hides the system pointer and draws a pointer reflected across the area's vertical centre line, with a Continue button inside and a press counter below. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing an area (a position-relative div) and a readout paragraph below it.
- Inside the area, render one native type="button" labelled “Continue” as its text content, then a div holding the drawn pointer with aria-hidden="true".
- The drawn pointer is an inline SVG, viewBox "0 0 16 22", width 16, height 22, with one path: d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.6-1.1-2.9-6.5h6z", fill light-dark(#282824, #e8e7e0) and stroke light-dark(#fafaf6, #1a1a17) set through CSS (presentation attributes do not accept light-dark()), stroke-width 1.25, stroke-linejoin round.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Presses” and a span with the integer count, starting at 0.
- The button keeps native focus and keyboard activation. Its onClick handler increments the count, so Tab then Enter or Space presses it.

BEHAVIOR
- Keep the drawn position in pixels from the area's top-left corner, or null when none is drawn.
- On pointermove and pointerdown on the area, record the real position as (clientX - areaRect.left, clientY - areaRect.top). On pointerleave, record null.
- The drawn position is { x: area.clientWidth - real.x, y: real.y } when a real position is recorded, and null otherwise. Recompute it in a requestAnimationFrame callback scheduled by each pointer event, at most one pending frame at a time.
- On each computed frame: when the drawn position is null set the pointer div's visibility to hidden; otherwise set it visible and set its transform to translate3d(x px, y px, 0). Then set a data-hover attribute on the button if the drawn point, converted back to client coordinates, lies within the button's getBoundingClientRect() edges inclusive, and remove it otherwise.
- The button has pointer-events: none, so the real pointer never hovers, presses, or clicks it.
- Listen for click on the area. If the click event's target is the button itself (keyboard activation), do nothing there. Otherwise, if the most recent drawn position lies within the button's bounds as above, increment the count.
- Nothing animates, so there is no reduced-motion variant of the mechanism.
- Remove all listeners and cancel any pending frame on unmount.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is a vertical flex column that grows to fill its container (flex: 1, align-self: stretch), 12px gap, min-width 0, color light-dark(#282824, #e8e7e0).
- The area is position relative, flex 1, min-height 160px, overflow hidden, cursor none, touch-action manipulation.
- The button is absolutely positioned at top 50%, left 27%, transform translate(-50%, -50%); inline-flex centred; min-height 39px; padding 8px 16px; 1px solid transparent border; 5px radius; background light-dark(#30312b, #e8e7e0); text light-dark(#fafaf6, #1a1a17); inherited sans-serif font at 12px, weight 500, line-height 1.5; nowrap; transition background 150ms ease. With data-hover its background is light-dark(#4d5142, #cdd1c2). Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset.
- The pointer div is absolutely positioned at top -1.5px, left -1.5px, 16px by 22px, visibility hidden initially, pointer-events none, will-change transform. The SVG is display block.
- The readout is a flex row with space-between, margin 0, 11px, color light-dark(#6b6b63, #9c9c91). The count span is light-dark(#282824, #e8e7e0) in a sans-serif stack with tabular numerals.
- Under prefers-reduced-motion, remove the button's background transition.

DONE WHEN
- The system pointer is hidden in the area, and a drawn arrow appears mirrored horizontally, tip exactly on the reflected point, disappearing on leave.
- The button highlights and counts a click only when the drawn arrow is over it, never when the real pointer is.
- Keyboard focus and Enter or Space press the button and increment the live count exactly once.
`;
